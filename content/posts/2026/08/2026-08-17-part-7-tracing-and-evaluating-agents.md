---
title: "Part 7: Observability - Tracing and Evaluating Agents"
description: "Turn on tracing to see every decision your agent makes, then run a batch evaluation with built-in evaluators to catch quality regressions before your users do."
publishedDate: "2026-08-17"
updatedDate: "2026-08-17"
tags: ["Microsoft Foundry", "AI", "Observability", "Evaluation", "Azure", "Tutorial", "Series"]
series: "microsoft-foundry"
seriesOrder: 7
---

## What We're Doing Today

Every agent we've built since Part 3 has been a black box the moment you stop printing its output to a terminal. That's fine for a tutorial; it's not fine for anything you'd actually ship. Today we open the box up: tracing shows you exactly what your agent decided and why, and evaluation tells you whether it's actually any good, with numbers, not vibes.

By the end of this post, you'll have:

- Tracing enabled on your Foundry project, with a real trace to inspect
- A batch evaluation script that scores your agent against built-in quality and safety evaluators
- A read on what those scores actually mean, so a "3.5" isn't just a mystery number

## What You'll Need

- The project and agent from earlier parts.
- An Azure Monitor Application Insights resource: you'll create or connect one in Step 1.
- `pip install azure-ai-projects azure-identity python-dotenv` for the evaluation script.

## Step 1: Connect Application Insights

Tracing needs somewhere to store traces, and that's Application Insights. Connecting it is a one-time setup, and once it's done, Foundry logs traces automatically: no code changes required.

1. Open your project in the [Foundry portal](https://ai.azure.com).
2. In the left navigation, select **Agents**, then select **Traces** at the top.
3. Select **Connect**.
4. Choose an existing Application Insights resource, or select **Create new** and follow the wizard.

If you don't see that message bar, use the alternate path: **Manage** > **Project details** > **Connected resources** tab > **Add connection** > **Application Insights**.

That's the whole setup. Server-side tracing now covers prompt agents, hosted agents, and workflows (anything running in Foundry) with zero instrumentation on your part.

## Step 2: Generate and View a Trace

Run any agent from earlier in this series, the file search agent from Part 5 is a good one, since it has a tool call to trace, not just a chat response.

```python
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient

PROJECT_ENDPOINT = "your_project_endpoint"
AGENT_NAME = "docs-helper"

project = AIProjectClient(endpoint=PROJECT_ENDPOINT, credential=DefaultAzureCredential())
openai = project.get_openai_client(agent_name=AGENT_NAME)

conversation = openai.conversations.create()
response = openai.responses.create(
    conversation=conversation.id,
    input="What colors does the Widget Pro ship in?",
)
print(response.output_text)
```

Then, back in the portal:

1. Go to **Agents** > **Traces**.
2. Wait a minute or two, traces typically land within 2–5 minutes of the run.
3. Select the new trace. You'll see a span timeline: the model call, the file search tool invocation, and the final response, each with latency and status.
4. Select the **Conversation ID** to see the full turn-by-turn history, including inputs and outputs at each step.

This is the debugging tool you'll actually reach for once something misbehaves: instead of guessing why an agent gave a weird answer, you can see exactly which tool it called, with what arguments, and what came back.

If you need visibility into your own application code around the agent call (not just the agent itself), add client-side instrumentation:

```bash
pip install azure-ai-projects azure-identity opentelemetry-sdk azure-core-tracing-opentelemetry
```

That's a second, optional layer on top of server-side tracing, not a replacement for it.

## Step 3: Run a Batch Evaluation

Tracing tells you what happened in one run. Evaluation tells you how good your agent is across many runs, with a repeatable score you can compare over time. Foundry ships built-in evaluators for quality (`fluency`, `coherence`), safety (`violence`, `self_harm`), and agent-specific behavior (`task_adherence`, did it actually follow instructions).

```python
import os
import time
from pprint import pprint

from azure.ai.projects import AIProjectClient
from azure.ai.projects.models import DataSourceConfigCustom
from azure.identity import DefaultAzureCredential

PROJECT_ENDPOINT = "your_project_endpoint"
AGENT_NAME = "docs-helper"
MODEL_DEPLOYMENT_NAME = "gpt-5-1-mini-demo"

with (
    DefaultAzureCredential() as credential,
    AIProjectClient(endpoint=PROJECT_ENDPOINT, credential=credential) as project,
    project.get_openai_client() as openai,
):
    data_source_config = DataSourceConfigCustom(
        type="custom",
        item_schema={
            "type": "object",
            "properties": {"query": {"type": "string"}},
            "required": ["query"],
        },
        include_sample_schema=True,
    )

    testing_criteria = [
        {
            "type": "azure_ai_evaluator",
            "name": "fluency",
            "evaluator_name": "builtin.fluency",
            "initialization_parameters": {"deployment_name": MODEL_DEPLOYMENT_NAME},
            "data_mapping": {"query": "{{item.query}}", "response": "{{sample.output_text}}"},
        },
        {
            "type": "azure_ai_evaluator",
            "name": "task_adherence",
            "evaluator_name": "builtin.task_adherence",
            "initialization_parameters": {"deployment_name": MODEL_DEPLOYMENT_NAME},
            "data_mapping": {"query": "{{item.query}}", "response": "{{sample.output_items}}"},
        },
    ]

    eval_object = openai.evals.create(
        name="docs-helper Evaluation",
        data_source_config=data_source_config,
        testing_criteria=testing_criteria,
    )

    data_source = {
        "type": "azure_ai_target_completions",
        "source": {
            "type": "file_content",
            "content": [
                {"item": {"query": "What colors does the Widget Pro ship in?"}},
                {"item": {"query": "What's the warranty on the Widget Pro?"}},
                {"item": {"query": "Do you sell a Widget Pro Max?"}},
            ],
        },
        "input_messages": {
            "type": "template",
            "template": [
                {"type": "message", "role": "user", "content": {"type": "input_text", "text": "{{item.query}}"}}
            ],
        },
        "target": {"type": "azure_ai_agent", "name": AGENT_NAME, "version": "1"},
    }

    run = openai.evals.runs.create(eval_id=eval_object.id, name="docs-helper run", data_source=data_source)

    while run.status not in ["completed", "failed"]:
        time.sleep(5)
        run = openai.evals.runs.retrieve(run_id=run.id, eval_id=eval_object.id)
        print(f"status: {run.status}")

    print(f"Result counts: {run.result_counts}")
    output_items = list(openai.evals.runs.output_items.list(run_id=run.id, eval_id=eval_object.id))
    pprint(output_items)
    print(f"Report URL: {run.report_url}")

    openai.evals.delete(eval_id=eval_object.id)
```

Run it, and you get pass/fail results for three test queries, scored by two evaluators each. The third query (asking about a product that doesn't exist) is deliberately there to check that the agent says "I don't know" instead of hallucinating a Widget Pro Max, which is exactly the kind of failure a spot-check in the playground won't catch but a repeatable evaluation will.

## Reading the Scores

Each output item gives you a label, a score, and (for LLM-judged evaluators) a reason explaining why:

- **Quality evaluators** (fluency, coherence): 1–5 scale, higher is better.
- **Safety evaluators** (violence, self-harm): 0–7 severity scale, **lower** is safer.
- **Task evaluators** (task_adherence): 1–5 scale, higher means it followed instructions more closely.

Don't compare a fluency score to a task_adherence score directly; they're different scales measuring different things. What you want to track is the same evaluator's score over time, across agent or prompt changes, to catch regressions.

You can also open the run in the portal instead of reading raw output items: select **Evaluation** in your project, then the run, for the same results with charts and filtering.

## From One-Off Evaluation to Continuous Monitoring

Running this script once tells you how your agent scores today. For production, you want to know if it's getting worse. Foundry's **continuous evaluation** samples live traffic on a schedule and surfaces the same metrics on a dashboard, connected to the traces from Step 2 for root-cause debugging. Set it up from **Build** > **Evaluations** > **Recurring Configs** in the portal, choose **Continuous evaluation**, and point it at live traffic instead of a fixed dataset. That's the production version of what you just did by hand, worth setting up once you're past prototyping.

## Troubleshooting

### No traces show up after 5+ minutes

Confirm the Application Insights connection actually succeeded (check **Connected resources**), then generate fresh traffic: traces only appear for runs after the connection was established, not retroactively.

### 403 or authorization errors viewing traces

You need the **Log Analytics Reader** role on the connected Application Insights resource, separate from your Foundry project role. If the underlying tables are marked Protected, you also need **Privileged Monitoring Data Reader**.

### Evaluation run stuck in "running"

Batch evaluations can take a few minutes depending on dataset size and evaluator count. If it's stuck well beyond that, check the report URL in the portal for a more detailed status than the polling loop shows.

### `task_adherence` scores are low even though answers look correct

`task_adherence` measures whether the agent followed its *instructions*, not just whether the answer is factually right. Check your agent's instructions for ambiguity; this evaluator often catches instruction problems, not just knowledge problems.

## What's Next

You can now see what your agent does and measure how well it does it. The last piece is making sure it's safe to actually put in front of real users and real data. Part 8 covers Entra identity, RBAC, network isolation, and the governance checklist to work through before you ship.
