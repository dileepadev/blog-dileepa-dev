---
title: "Part 4: Picking the Right Model"
description: "A practical tour of the Microsoft Foundry model catalog: how to filter, benchmark, and compare models, then swap your agent onto a different one without guessing."
publishedDate: "2026-08-14"
updatedDate: "2026-08-14"
tags: ["Microsoft Foundry", "AI", "Model Catalog", "Azure", "Tutorial", "Series"]
series: "microsoft-foundry"
seriesOrder: 4
---

## What We're Doing Today

So far this series has used one model (`gpt-5.1-mini`) because it's small, cheap, and good enough to prove the plumbing works. But Foundry's whole pitch is that you're not locked into one provider or one model. The catalog has 1,900+ models from OpenAI, Anthropic, Meta, DeepSeek, Mistral, and more, and picking blindly is how you end up overpaying for quality you don't need, or underpowering a task that actually needed a bigger model.

By the end of this post, you'll have:

- A working mental model of how the Foundry model catalog is organized
- Used the leaderboard and benchmark tools to compare models on quality, safety, cost, and throughput
- Deployed a second model
- Swapped your Part 3 agent onto it, with no code changes beyond the deployment name

## What You'll Need

- The project and agent from Parts 2 and 3.
- **Reader** role on the project, at minimum, to browse the leaderboard (you'll already have more than this if you've been following along).
- A paid Azure subscription for the leaderboard and benchmark comparison tools: free/trial subscriptions can browse the catalog but not the leaderboard.

## How the Catalog Is Organized

Open the [Foundry portal](https://ai.azure.com), go to your project, and select **Discover** in the top navigation. This is the model catalog, and it's organized into two buckets that matter more than they sound like they should:

- **Foundry Models sold by Azure**: first-party support, deep Azure integration, enterprise SLAs, and (useful detail) fungible provisioned throughput, meaning quota reserved for one of these models can flex across any other model in the group.
- **Models from partners and community**: everything else. Still fully usable, but you're working under the provider's own terms, and you don't get the same throughput fungibility.

Neither bucket is "better" by default: a partner model can easily be the right call for your use case. It's just a distinction worth knowing before you commit quota to one.

From there, filters do the narrowing:

- **Collections**: filter by provider (OpenAI, Meta, DeepSeek, and so on)
- **Region**: where the model can actually be deployed; not every model is available everywhere
- **Deployment options**: Standard (pay-per-call), Provisioned (reserved throughput), Batch (cheap, non-real-time), or Managed compute (you own the VM)
- **Lifecycle**: Preview, Generally available, or Deprecated. Skip Deprecated unless you're maintaining something legacy.
- **Supported features**: reasoning, tool/function calling, vision, structured output
- **Inference tasks**: chat completion, embeddings, image generation, and so on

If you already know you need, say, a vision-capable model with function calling that's GA and deployable in your region, you can filter down to a handful of candidates in a few clicks instead of reading marketing pages.

## Reading a Model Card

Click into any model and you land on its card, which has five tabs worth knowing:

- **Quick facts**: context window, modality, pricing at a glance
- **Details**: full description, version info, supported data types
- **Deployments**: any deployments you already have of this model
- **Benchmarks**: quality, safety, cost, and throughput scores (not every model has this tab, benchmarking isn't published for everything yet)
- **License**: legal terms, which matter more than people usually check, especially for open-weight models with usage restrictions

The Benchmarks tab is the one you'll use most. It shows an aggregate quality index plus per-metric breakdowns, and (this is the part people miss) the scores are normalized indexes, not raw numbers you can eyeball intuitively. Higher is better for quality and safety; lower is better for estimated cost; higher is better for throughput. Use the comparative chart, not the number alone.

## Using the Model Leaderboard

The leaderboard is where side-by-side comparison actually happens.

1. From **Discover**, the catalog overview shows a leaderboard snapshot at the top. Select **Go to leaderboard** for the full view.
2. Sort by quality, safety, estimated cost, or throughput to see top performers for each.
3. Scroll to **Trade-off charts**. This is the genuinely useful part: pick two axes (say, quality vs. cost) and see where models land visually. The model in the top-right corner of a quality-vs-cost chart is winning on both, but that's rare. Usually you're picking a point on a curve.
4. Scroll further to **Leaderboards by scenario** if your use case maps to something specific: reasoning, coding, question answering. A model that's mid-pack overall can be top-of-class for your specific scenario.

Select two or three models (checkboxes next to their names), then select **Compare**. You get a side-by-side view across performance benchmarks, model details (context window, training data, languages), supported endpoints, and feature support (function calling, structured output, vision). This is the view to screenshot and put in a design doc before you commit to a model for a production feature.

## Deploy a Second Model

Let's make this concrete. Deploy a second, more capable model alongside `gpt-5.1-mini` so you have something to compare against in practice.

### Via Azure CLI

```bash
az cognitiveservices account deployment create \
  --name my-foundry-resource \
  --resource-group my-foundry-rg \
  --deployment-name gpt-5-1-demo \
  --model-name gpt-5.1 \
  --model-version "2025-11-13" \
  --model-format OpenAI \
  --sku-capacity 10 \
  --sku-name Standard
```

### Via Foundry Portal

1. In your project, select **Build** > **Models**, then **Deploy model** > **Deploy base model**.
2. Search for `gpt-5.1` in the catalog and select it.
3. Select **Deploy**, keeping the default settings unless you have a specific reason to change quota or content filtering.
4. Note the deployment name: you'll need it next.

## Swap Your Agent to the New Model

Now point the agent from Part 3 at this new deployment. In the portal, open your agent, change the model dropdown to `gpt-5-1-demo`, and save. That's it, no redeploy. In code, it's a one-line change:

```python
agent = project.agents.create_version(
    agent_name="docs-helper",
    definition=PromptAgentDefinition(
        model="gpt-5-1-demo",  # was gpt-5-1-mini-demo
        instructions=(
            "You are a helpful assistant that answers questions about geography. "
            "Keep answers to two sentences unless asked for more detail."
        ),
    ),
)
```

This creates a new version of the same agent, now backed by a different model, with identical instructions. Ask it the same questions you tried in Part 3 and compare the answers: this is the fastest way to build intuition for how much a model swap actually changes behavior for your specific instructions, beyond what any benchmark chart tells you.

## A Rough Decision Framework

Benchmarks help, but here's the shortcut I actually use day-to-day:

- **High-volume, latency-sensitive, simple task** (classification, extraction, short chat) → small/mini model. Cheapest, fastest, usually good enough.
- **Complex reasoning, multi-step tool use, ambiguous instructions** → a reasoning-tier model. Slower and pricier, but wrong answers from a cheap model cost more than the API bill.
- **Vision, audio, or multimodal input** → filter by **Supported features** first; most models simply don't do this, so the catalog narrows fast.
- **Data residency or compliance constraints** → check **Region** availability and the **License** tab before anything else. A great model you can't deploy in your required region isn't a candidate.
- **Unsure** → deploy two candidates, run the same prompts through both (like you just did above), and let the actual outputs decide. Benchmarks are a starting filter, not a substitute for testing against your own instructions and data.

## Troubleshooting

### Model doesn't appear in the leaderboard

Not all catalog models are benchmarked. Check the model card directly: if there's no **Benchmarks** tab, results haven't been published yet.

### Can't access the leaderboard at all

The leaderboard requires a paid subscription. Free or trial subscriptions can browse the catalog and deploy models, just not use the comparison tools.

### Deployment fails with a quota error

Different models draw from different quota pools, and regional capacity varies. Try a different region, or check **Manage quotas** in the portal to see what's available on your subscription.

### Trade-off chart shows nothing

You need at least two models selected in the model selector for the trade-off chart to render anything.

## What's Next

You now have two deployed models and a repeatable way to compare more. In Part 5, we go back to the agent itself and give it something more useful to do than answer from memory: File Search over your own documents, and Bing grounding for real-time web data.
