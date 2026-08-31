---
title: "Agent Evaluation: Moving Beyond Vibe Checks to CI-Driven Testing"
description: "How to test non-deterministic AI agents in CI using deterministic assertions, trajectory checks, and structured LLM-as-a-judge rubrics."
publishedDate: "2026-08-31"
updatedDate: "2026-08-31"
tags: ["AI", "AI Engineering", "Testing", "Python", "LLM", "Agents", "DevOps"]
---

## The Problem with "Looks Good to Me"

When you build a conventional software function, testing is straightforward: given input $X$, assert output $Y$. If someone alters the implementation, your test suite flags any regression in milliseconds.

When you build an AI agent, testing usually starts as a "vibe check":
1. You run three sample prompts in a playground or terminal.
2. The responses read well.
3. You commit the code and deploy.

Two weeks later, someone adjusts the system prompt to fix a formatting issue for customer support, and the agent quietly stops calling its retrieval tool for half of the user queries. Nobody notices until customer complaints arrive.

The challenge is that AI agents are non-deterministic, multi-step systems. They reason, select tools, handle intermediate failures, and synthesize answers in natural language. You cannot write a simple `assert response == "exact string"` test.

To run agents in production with confidence, you need an evaluation strategy that separates what can be tested deterministically from what requires semantic grading, and automates both in CI.

## The Three Layers of Agent Evaluation

A reliable evaluation pipeline splits testing into three distinct layers:

| Layer | What it tests | How it tests | Speed & Cost |
| --- | --- | --- | --- |
| **1. Unit & Schema Assertions** | Output formatting, type adherence, boundary conditions | Code assertions, Pydantic validation, regex | Instant, free |
| **2. Trajectory Evaluation** | Tool selection, call order, argument validation, iteration bounds | Trace inspection against expected action sequences | Fast, free (mocked) or cheap |
| **3. Model-Graded Evaluation** | Semantic accuracy, faithfulness, tone, hallucination | LLM-as-a-judge with structured scoring rubrics | Slower, API cost per test run |

Let's look at how to implement each layer in Python with standard tooling like `pytest` and `pydantic`.

## Layer 1: Unit and Schema Assertions

Before you spend money calling a model to grade another model, test everything that can be evaluated with ordinary deterministic Python code.

Every production agent should produce structured output for machine-to-machine interactions. If your agent is supposed to return a structured decision, assert its schema explicitly:

```python
import pytest
from pydantic import BaseModel, Field, ValidationError

class TicketResolution(BaseModel):
    category: str = Field(description="Support category: Billing, Technical, or Account")
    confidence: float = Field(ge=0.0, le=1.0)
    requires_escalation: bool
    summary: str

def validate_agent_output(raw_json: str) -> TicketResolution:
    return TicketResolution.model_validate_json(raw_json)

def test_agent_output_schema_conformance():
    sample_response = """
    {
        "category": "Billing",
        "confidence": 0.95,
        "requires_escalation": false,
        "summary": "Refund processed for duplicate charge."
    }
    """
    resolution = validate_agent_output(sample_response)
    assert resolution.category in {"Billing", "Technical", "Account"}
    assert 0.0 <= resolution.confidence <= 1.0
    assert isinstance(resolution.requires_escalation, bool)
    assert len(resolution.summary.strip()) > 0

def test_agent_output_rejects_invalid_schema():
    invalid_response = """
    {
        "category": "Unknown",
        "confidence": 1.5,
        "requires_escalation": "no"
    }
    """
    with pytest.raises(ValidationError):
        validate_agent_output(invalid_response)
```

### Deterministic Constraint Checks

In addition to schema validation, deterministic assertions should check:
- **Refusal handling**: When given an adversarial prompt or out-of-scope query, does the agent decline without leaking system instructions?
- **Prohibited content filters**: Ensure raw PII (social security numbers, API keys) or banned keywords are absent from the output via regex or string scanning.
- **Latency and token budgets**: Assert that the agent completed within its allocated step count and token budget.

## Layer 2: Trajectory Evaluation (Testing the Path)

The most common failure mode in multi-step agents is not a bad final answer—it is a broken decision path. An agent might guess an answer from training memory instead of calling the search tool, or it might get stuck in an infinite tool-calling loop.

Trajectory evaluation inspects the sequence of actions the agent took to reach the answer.

```text
User Input: "What is the return policy for order #8491?"
   ↓
Expected Trajectory:
  1. Tool Call: lookup_order(order_id="8491")
  2. Tool Call: fetch_policy(category="electronics")
  3. Final Response: Synthesized explanation
```

### Testing Tool Selection and Call Arguments

Using your framework's tracing capabilities or mock tool execution, you can test that the agent selected the right tools in the right order:

```python
from dataclasses import dataclass
from typing import Any, Dict, List

@dataclass
class ToolCallRecord:
    tool_name: str
    arguments: Dict[str, Any]

def evaluate_trajectory(
    recorded_calls: List[ToolCallRecord],
    expected_tools: List[str],
) -> None:
    actual_tools = [call.tool_name for call in recorded_calls]
    assert actual_tools == expected_tools, f"Expected {expected_tools}, got {actual_tools}"

def test_support_agent_trajectory():
    # Simulated execution trace from an agent run
    execution_trace = [
        ToolCallRecord(tool_name="lookup_customer", arguments={"email": "alex@example.com"}),
        ToolCallRecord(tool_name="get_subscription_status", arguments={"customer_id": "cust_123"}),
    ]

    evaluate_trajectory(
        recorded_calls=execution_trace,
        expected_tools=["lookup_customer", "get_subscription_status"],
    )

    # Validate specific argument values
    assert execution_trace[0].arguments["email"] == "alex@example.com"
    assert execution_trace[1].arguments["customer_id"] == "cust_123"
```

Trajectory testing gives you immediate insight into *why* an agent went off course before you inspect the prose in the final answer.

## Layer 3: Model-Graded Evaluation (LLM-as-a-Judge)

Some qualities cannot be validated with regular expressions or schemas:
- **Faithfulness**: Did the agent make claims not supported by the retrieved context?
- **Completeness**: Did the answer address all parts of the user's question?
- **Tone and clarity**: Is the explanation concise and professional?

This is where you use an LLM as an automated evaluator.

### Writing an Effective Evaluation Rubric

An LLM judge fails when the rubric is vague (e.g., "Rate this answer from 1 to 5"). It succeeds when given explicit grading criteria and required to output a structured verdict with chain-of-thought justification.

```python
from pydantic import BaseModel, Field

class JudgeEvaluation(BaseModel):
    chain_of_thought: str = Field(description="Step-by-step reasoning explaining the score")
    faithfulness_score: int = Field(description="1 if completely grounded in context, 0 if hallucinated")
    relevance_score: int = Field(description="1 if fully answers question, 0 if off-topic or incomplete")
    contains_hallucinations: bool
    passed: bool

JUDGE_PROMPT_TEMPLATE = """
You are an impartial evaluator assessing the quality of an AI assistant's response.

[Context Grounding Data]
{context}

[User Question]
{question}

[Assistant Response]
{response}

Evaluate the response against the following criteria:
1. Faithfulness: Every factual statement in the response must be directly supported by the context.
2. Relevance: The response must directly answer what the user asked without irrelevant filler.

Output your evaluation as structured JSON adhering to the JudgeEvaluation schema.
"""
```

### Implementing the Judge Test in Pytest

```python
import json
import pytest

def mock_call_judge_model(prompt: str) -> JudgeEvaluation:
    # In practice, call your evaluator model (e.g., GPT-4o, Claude 3.5 Sonnet)
    # with structured output mode enabled
    return JudgeEvaluation(
        chain_of_thought=(
            "The assistant stated the return window is 30 days, which matches the context. "
            "It directly answered the customer's question regarding restocking fees."
        ),
        faithfulness_score=1,
        relevance_score=1,
        contains_hallucinations=False,
        passed=True,
    )

@pytest.mark.parametrize(
    "question,context,response",
    [
        (
            "What is the refund window for hardware?",
            "Hardware purchases may be returned within 30 days of delivery.",
            "You can return hardware purchases within 30 days of delivery for a full refund.",
        ),
    ],
)
def test_agent_response_faithfulness(question: str, context: str, response: str):
    prompt = JUDGE_PROMPT_TEMPLATE.format(
        question=question,
        context=context,
        response=response,
    )
    evaluation = mock_call_judge_model(prompt)

    assert evaluation.passed, f"Judge failed: {evaluation.chain_of_thought}"
    assert not evaluation.contains_hallucinations
    assert evaluation.faithfulness_score == 1
```

## Running Evaluations in CI

Running a 100-case LLM evaluation suite on every pull request commit can be slow and expensive. A practical CI workflow uses tiered execution:

```text
Pull Request Opened
        │
        ▼
Tier 1: Fast & Free (Every Commit)
  - Python linting & formatting (Ruff, Pyright)
  - Unit tests & Pydantic schema validation
  - Deterministic security & regex checks
        │
        ▼
Tier 2: Trajectory Mock Suite (Every PR)
  - Mocked agent runs against 25 golden test cases
  - Validate tool selection, arguments, and refusal logic
        │
        ▼
Tier 3: Model-Graded Eval (Merge to Main / Nightly)
  - Run full test suite with LLM-as-a-judge
  - Record scores and drift metrics to evaluation dashboard
```

### GitHub Actions Workflow Example

Here is how you can configure Tier 1 and Tier 2 tests in your CI workflow:

```yaml
name: Agent Evaluation

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: |
          pip install pytest pydantic httpx

      - name: Run Deterministic & Trajectory Tests
        run: |
          pytest tests/evals/test_schemas.py tests/evals/test_trajectories.py

      - name: Run Sample Model-Graded Evals
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        env:
          OPENAI_API_KEY: ${{ secrets.EVAL_OPENAI_API_KEY }}
        run: |
          pytest tests/evals/test_llm_judge.py
```

## Building Your Golden Dataset

Evaluation is only as good as the test cases you feed it. To build a reliable golden dataset:

1. **Capture production edge cases**: Every time a user reports a bad response, turn that prompt and the expected resolution into a test case.
2. **Include negative test cases**: Test for out-of-scope requests, prompt injection attempts, and missing permissions.
3. **Keep test cases versioned**: Store your eval dataset in Git (JSON Lines or YAML format) alongside your agent code so test updates are reviewed in the same PR.

## Summary

Moving from ad-hoc experimentation to engineering maturity requires automated evaluation:

- Use **Schema assertions** to guarantee output structure and type safety.
- Use **Trajectory tests** to verify that your agent reasons, selects tools, and passes arguments correctly.
- Use **Model-graded rubrics** to score factual grounding and answer quality.
- Tier your tests in CI so fast deterministic checks run on every commit and expensive evaluations run on merge or scheduled runs.
