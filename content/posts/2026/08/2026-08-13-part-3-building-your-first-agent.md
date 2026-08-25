---
title: "Part 3: Building Your First Agent"
description: "Prompt agents vs. hosted agents in Microsoft Foundry, explained. Then build one in the portal, give it instructions, test it in the playground, and call it from code."
publishedDate: "2026-08-13"
updatedDate: "2026-08-13"
tags: ["Microsoft Foundry", "AI", "Agents", "Azure", "Tutorial", "Series"]
series: "microsoft-foundry"
seriesOrder: 3
---

## What We're Doing Today

[Part 2](/blog/2026-08-12-part-2-your-first-foundry-project) got you a Foundry project with a deployed model that answers plain chat completion requests. That's an endpoint, not an agent: it has no memory, no instructions, no tools. Today we fix that.

By the end of this post, you'll have:

- A clear picture of the two ways to build in Foundry: prompt agents and hosted agents, and which one you want
- A prompt agent created in the Foundry portal, with instructions and a persona
- That same agent tested in the Agents playground
- The same agent created and called from Python, so you can build on it in code

## What You'll Need

- The Foundry project and deployed model from [Part 2](/blog/2026-08-12-part-2-your-first-foundry-project). This post assumes the deployment name `gpt-5-1-mini-demo`.
- The **Foundry User** role on your project (this is the role that lets you create and run agents; it's separate from the account-level roles you needed in Part 2).
- Python 3.9+ if you want to follow the code path. Install the SDK:

```bash
pip install "azure-ai-projects>=2.3.0" azure-identity
```

## Prompt Agents vs. Hosted Agents

Foundry's Agent Service gives you two fundamentally different ways to build an agent, and picking the wrong one early costs you real rework later.

**Prompt agents** are defined entirely through configuration: a model, instructions, and (optionally) tools. You describe what the agent should do in natural language, Foundry stores that definition server-side, and Foundry runs it for you. No containers, no infrastructure, nothing to scale or patch. You build them in the portal for a fast start, or with the SDK/REST API when you want them version-controlled and deployed through a pipeline.

**Hosted agents** are your own code (built with Agent Framework, LangGraph, the OpenAI Agents SDK, or whatever you're already using) packaged as a container or a zip of source. Foundry runs it with a managed endpoint, autoscaling, and a dedicated Microsoft Entra identity per agent. You own the orchestration logic; Foundry owns the plumbing around it.

Here's the practical difference:

| | Prompt agents | Hosted agents |
|---|---|---|
| **You write** | Instructions + config | Application code |
| **Runtime to maintain** | None | Your container/logic |
| **Compute to manage** | None, fully managed | Foundry-managed containers |
| **Best for** | Fast starts, internal tools, agents without custom orchestration | Custom code, multi-agent orchestration, custom protocols |

If you're not sure which one you need, start with a prompt agent. It's the fastest path to something working, and you can always graduate to a hosted agent later if you outgrow it; we'll get there in [Part 6](/blog/2026-08-16-part-6-multi-agent-systems) when we talk about multi-agent systems. Today, we're building a prompt agent.

## Step 1: Create an Agent in the Foundry Portal

1. Go to the [Foundry portal](https://ai.azure.com) and open your project from Part 2.
2. In the left navigation, select **Build** > **Agents**.
3. Select **New agent**.
4. Give it a name. Names are permanent once set: you reference the agent as `<name>:<version>` in code, so pick something descriptive like `docs-helper` rather than `test1`.
5. In the model dropdown, pick the deployment you created in Part 2 (`gpt-5-1-mini-demo`).
6. In the **Instructions** box, describe what you want the agent to do. Something like:

```text
You are a helpful assistant that answers questions about geography.
Keep answers to two sentences unless asked for more detail.
```

7. Select **Create**. Foundry saves this as version 1 of your agent.

That's it: no deploy step, no waiting for provisioning. The agent exists the moment you save it.

## Step 2: Test It in the Agents Playground

1. From the agent's page, select **Try in playground** (or it may open automatically after creation).
2. Type a question in the chat box, try something that tests the instructions you gave it, like *"What's the capital of France, and how big is the country?"*
3. Watch the response. It should follow your instructions (two sentences, geography-focused).
4. Ask a follow-up question in the same conversation, like *"What about its population?"* The agent should keep context from the previous turn: that's the playground maintaining a conversation thread for you automatically.

The playground also shows you tracing and evaluation data as you chat, which we'll dig into properly in [Part 7](/blog/2026-08-17-part-7-tracing-and-evaluating-agents). For now, just confirm the agent behaves the way you told it to.

If the response ignores your instructions or feels off, edit the **Instructions** box directly in the portal and re-test. Iterating here is free and instant: no redeploy required.

## Step 3: Create the Same Agent in Code

The portal is great for prototyping, but you'll want agents defined in code once you're building something real: it's version-controlled, reviewable, and scriptable in CI/CD. Here's the same agent from Step 1, created with the Python SDK.

```python
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient
from azure.ai.projects.models import PromptAgentDefinition

# Format: "https://<resource-name>.services.ai.azure.com/api/projects/<project-name>"
PROJECT_ENDPOINT = "your_project_endpoint"
AGENT_NAME = "docs-helper"

project = AIProjectClient(
    endpoint=PROJECT_ENDPOINT,
    credential=DefaultAzureCredential(),
)

agent = project.agents.create_version(
    agent_name=AGENT_NAME,
    definition=PromptAgentDefinition(
        model="gpt-5-1-mini-demo",
        instructions=(
            "You are a helpful assistant that answers questions about geography. "
            "Keep answers to two sentences unless asked for more detail."
        ),
    ),
)

print(f"Agent created (id: {agent.id}, name: {agent.name}, version: {agent.version})")
```

Sign in first with `az login` so `DefaultAzureCredential` has something to authenticate with. Run the script, and you'll get an agent, same as the one you clicked together in the portal, just reproducible.

A couple of things worth knowing:

- `model` here is your **deployment name**, not the underlying model's name. If you named your deployment something other than `gpt-5-1-mini-demo` in Part 2, use that instead.
- Creating an agent with the same `agent_name` again doesn't overwrite it; it creates a new version. You can pin code to a specific version or always resolve the latest.

## Step 4: Chat With the Agent From Code

```python
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient

PROJECT_ENDPOINT = "your_project_endpoint"
AGENT_NAME = "docs-helper"

project = AIProjectClient(
    endpoint=PROJECT_ENDPOINT,
    credential=DefaultAzureCredential(),
)
openai = project.get_openai_client(agent_name=AGENT_NAME)

# A conversation keeps multi-turn history, same as the playground thread
conversation = openai.conversations.create()

response = openai.responses.create(
    conversation=conversation.id,
    input="What's the capital of France, and how big is the country?",
)
print(response.output_text)

response = openai.responses.create(
    conversation=conversation.id,
    input="What about its population?",
)
print(response.output_text)
```

Run it, and you should see two short, geography-flavored answers, with the second one clearly aware of the first (it knows "its population" means France, not some random country). That's the same conversation-threading behavior you saw in the playground, now scriptable.

## Troubleshooting

### "Permission denied" or 403 when creating an agent

You need the **Foundry User** role at the project scope, not just the account-scoped roles from Part 2. Ask your project admin to assign it, or assign it yourself if you have Owner/Contributor.

### Agent ignores instructions

Instructions are guidance, not hard constraints; models can still drift, especially with vague wording. Be specific ("keep answers to two sentences") rather than vague ("be concise"), and test edge cases in the playground before trusting it in code.

### `model` not found when creating via code

Double-check you're passing the **deployment name**, not the model's catalog name (e.g., `gpt-5-1-mini-demo`, not `gpt-5.1-mini`). If you're not sure what you named it, check **Models + Endpoints** in the portal.

### Conversation doesn't remember earlier turns

Make sure you're reusing the same `conversation.id` across calls. Each new `conversations.create()` starts a fresh thread with no history.

## What's Next

You've now got an agent with a persona, built two ways: click-through in the portal and reproducible in code. Both point at the same underlying model deployment from Part 2, so you can keep iterating on either path.

In Part 4, we step back from building and look at the model catalog itself: how to actually pick between the 1,900+ models on offer instead of defaulting to whatever's fastest to type.

