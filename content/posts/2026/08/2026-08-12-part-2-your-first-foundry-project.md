---
title: "Part 2: Standing Up Your First Foundry Project"
description: "Create your first Microsoft Foundry project, deploy a model, and make your first API call. Everything you need to get from nothing to a working AI endpoint in 15 minutes."
publishedDate: "2026-08-12"
updatedDate: "2026-08-12"
tags: ["Microsoft Foundry", "AI", "Getting Started", "Azure", "Tutorial", "Series"]
series: "microsoft-foundry"
seriesOrder: 2
---

## What We're Doing Today

By the end of this post, you'll have:

- A Microsoft Foundry project in your Azure subscription
- A model deployed and ready to take requests
- Your first API call working from the command line
- The endpoint and credentials you need to build on this in later parts

This part is pure infrastructure: no agents yet, no custom tools. Just the scaffolding you need. Think of it as "prove that the lights are on" before you build the house.

## What You'll Need

- An Azure subscription. A free trial works fine. If you don't have one yet, [create one here](https://azure.microsoft.com/pricing/purchase-options/azure-account).
- Either the Azure CLI (version 2.67.0 or later) or the ability to use the Azure portal. I'll show both approaches, and you can pick whichever is less friction for you.
- About 15 minutes.

If you're on a team and someone already set up a Foundry project, you can skip ahead to [Accessing an Existing Project](#accessing-an-existing-project).

## Step 1: Verify Your Azure Permissions

Before you create anything, make sure you have the right permissions. You need one of these roles at the subscription or resource group level:

- **Foundry Account Owner** (or the old name, Azure AI Account Owner)
- **Foundry Owner** (or the old name, Azure AI Owner)
- **Owner** or **Contributor** on the subscription

Don't have those roles? Ask your subscription admin to assign one before proceeding.

Also, note: Microsoft renamed the Foundry RBAC roles recently. "Azure AI Owner" became "Foundry Owner". The underlying role IDs and permissions didn't change, but you might see both names in the portal while the rename rolls out. They're the same thing.

## Step 2: Create a Resource Group (Optional but Recommended)

A resource group is just a folder in Azure. Putting all your Foundry stuff in one keeps it organized and makes cleanup easier later.

### Via Azure CLI

```bash
az group create --name my-foundry-rg --location eastus
```

Replace `eastus` with a region close to you if you prefer. See [Microsoft Foundry's region support](https://learn.microsoft.com/en-us/azure/foundry/reference/region-support) for full options.

### Via Azure Portal

1. Go to the [Azure portal](https://portal.azure.com).
2. Search for "resource groups" in the search bar at the top.
3. Click **Create**.
4. Give it a name (e.g., `my-foundry-rg`), pick a region, and click **Create**.

## Step 3: Create the Foundry Resource

This is the actual "thing" in Azure that hosts your projects. One Foundry resource can contain multiple projects.

### Via Azure CLI

```bash
az cognitiveservices account create \
  --name my-foundry-resource \
  --resource-group my-foundry-rg \
  --kind AIServices \
  --sku S0 \
  --location eastus \
  --custom-domain my-foundry-resource \
  --allow-project-management
```

**Important details:**

- `--name`: Must be globally unique across Azure. If `my-foundry-resource` is taken, try something like `my-foundry-2026-<random>`.
- `--sku S0`: This is the standard tier. Enough to get started.
- `--custom-domain`: Also must be globally unique. Reuse your resource name if you want.
- `--allow-project-management`: This flag is required. Without it, you can't create projects inside this resource. You can't add it later, so don't skip it.

The resource usually provisions in 1-2 minutes. If it takes longer, that's fine; Azure is just thinking.

### Via Azure Portal

1. Go to the [Azure portal](https://portal.azure.com).
2. Click **Create a resource**.
3. Search for "Azure AI services" and click it.
4. On the resulting page, click **Create**.
5. Fill in the form:
   - **Subscription**: Choose your subscription.
   - **Resource group**: Pick `my-foundry-rg` (or whatever you named it in Step 2).
   - **Region**: Pick `East US` (or your preferred region).
   - **Name**: Something globally unique like `my-foundry-resource` (if taken, add a number or date).
   - **Pricing tier**: Choose **Standard S0**.
6. At the bottom, check the box that says "I acknowledge that I have read and understood all the terms above."
7. Click **Review + create**, then **Create**.

The resource will appear in your resource group once it finishes provisioning (usually 1-2 minutes).

## Step 4: Create Your First Project

Your project is where you'll actually work: models, agents, data, everything else lives here.

### Via Azure CLI

```bash
az cognitiveservices account project create \
  --name my-foundry-resource \
  --resource-group my-foundry-rg \
  --project-name my-foundry-project \
  --location eastus
```

Verify it was created:

```bash
az cognitiveservices account project show \
  --name my-foundry-resource \
  --resource-group my-foundry-rg \
  --project-name my-foundry-project
```

Look for `"provisioningState": "Succeeded"` in the output. If you see `"Succeeded"`, you're good.

### Via Azure Portal

1. Go to the [Microsoft Foundry portal](https://ai.azure.com) and sign in with your Azure account.
2. Look in the top-left corner. If this is your first time, you'll see a dropdown saying "Create a new project". Click it.
3. If you've been to Foundry before, click the project name in the top-left, then click **Create new project**.
4. On the form:
   - **Project name**: `my-foundry-project` (or whatever you want to call it).
   - **Select advanced options** to set the resource group and region if needed.
5. Click **Create project**.

Wait for the project overview page to load. When you see it, your project is ready.

## Step 5: Deploy a Model

Now that you have a project, you need a model to talk to. Foundry's model catalog includes 1,900+ models from OpenAI, Anthropic, Meta, and others. For this part, we'll use **GPT-5.1-mini**, which is small, fast, and cheap.

### Via Azure CLI

```bash
az cognitiveservices account deployment create \
  --name my-foundry-resource \
  --resource-group my-foundry-rg \
  --deployment-name gpt-5-1-mini-demo \
  --model-name gpt-5.1-mini \
  --model-version "2025-04-14" \
  --model-format OpenAI \
  --sku-capacity 10 \
  --sku-name Standard
```

The deployment name (`gpt-5-1-mini-demo`) is what you'll use in your code to refer to this deployment. Make it something descriptive.

Verify it succeeded:

```bash
az cognitiveservices account deployment show \
  --name my-foundry-resource \
  --resource-group my-foundry-rg \
  --deployment-name gpt-5-1-mini-demo
```

Look for `"provisioningState": "Succeeded"`. Deployments usually take 2-5 minutes to spin up.

### Via Azure Portal

1. In the Foundry portal, make sure you're in your project.
2. Click **Build** in the top-right navigation, then click **Models** in the left pane.
3. Search for `gpt-5.1-mini` in the model catalog.
4. Click on the **gpt-5.1-mini** result.
5. Click **Deploy** → **Default settings**.
6. You'll see a deployment name (defaulted to something like `gpt-5.1-mini-1`). You can change it if you want. Note this name: you'll need it later.
7. Click **Deploy**. The deployment will show up in your Models list with a "Provisioning" status. Come back in a few minutes, when it says "Succeeded", it's ready to use.

## Step 6: Get Your Project Endpoint

Your project has a single endpoint that you'll use for all API calls. You need to grab this now.

1. In the Foundry portal, make sure you're in your project.
2. You should see a welcome screen or a models page. Look for a box or section that shows your **Project endpoint** (usually starts with `https://` and contains `.services.ai.azure.com`).
3. Copy the full endpoint URL. It looks like: `https://my-foundry-resource.services.ai.azure.com/`

If you can't find it:
- Click **Build** in the top-right.
- The endpoint often appears at the top of the page or in the models section.

**Save this endpoint somewhere safe. You'll need it for every API call.**

## Step 7: Get Your API Key

Your API key is what authenticates your requests. Don't share it.

1. In the Foundry portal, click **Settings** (usually a gear icon, top-right).
2. Look for **Keys and endpoint** or similar.
3. Copy one of the keys (Key 1 or Key 2, they both work).

If you can't find it in the portal:

### Via Azure CLI

```bash
az cognitiveservices account keys list \
  --name my-foundry-resource \
  --resource-group my-foundry-rg
```

Copy one of the keys from the output.

**Save this key somewhere safe. Treat it like a password.**

## Step 8: Make Your First API Call

Now the fun part. Let's actually use the model.

The endpoint is `https://<your-resource-name>.services.ai.azure.com/openai/deployments/<deployment-name>/chat/completions?api-version=2024-10-01-preview`

Replace:
- `<your-resource-name>` with your resource name (e.g., `my-foundry-resource`)
- `<deployment-name>` with your deployment name (e.g., `gpt-5-1-mini-demo`)

### Using curl

```bash
curl -X POST https://my-foundry-resource.services.ai.azure.com/openai/deployments/gpt-5-1-mini-demo/chat/completions?api-version=2024-10-01-preview \
  -H "Content-Type: application/json" \
  -H "api-key: <your-api-key>" \
  -d '{
    "messages": [
      {"role": "user", "content": "Say hello, but make it fun. Keep it to one sentence."}
    ],
    "max_tokens": 100
  }'
```

Replace `<your-api-key>` with your actual API key.

### Using Python

```python
import requests
import json

endpoint = "https://my-foundry-resource.services.ai.azure.com"
deployment_name = "gpt-5-1-mini-demo"
api_key = "<your-api-key>"

url = f"{endpoint}/openai/deployments/{deployment_name}/chat/completions?api-version=2024-10-01-preview"

headers = {
    "Content-Type": "application/json",
    "api-key": api_key
}

payload = {
    "messages": [
        {"role": "user", "content": "Say hello, but make it fun. Keep it to one sentence."}
    ],
    "max_tokens": 100
}

response = requests.post(url, headers=headers, json=payload)
print(json.dumps(response.json(), indent=2))
```

### What You Should See

If everything worked, you'll get a response that looks like:

```json
{
  "id": "chatcmpl-xxxxx",
  "object": "text_completion",
  "created": 1723478400,
  "model": "gpt-5.1-mini",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Hey there! Ready to explore what's possible? 🎉"
      },
      "finish_reason": "stop",
      "index": 0
    }
  ],
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 15,
    "total_tokens": 27
  }
}
```

**Congratulations.** You just made your first successful call to a Foundry-hosted model.

## Troubleshooting

### "Invalid subscription key" or 401 error

- Double-check your API key is spelled correctly.
- Make sure you're using the right key (Key 1 or Key 2 from your Foundry resource).
- The key might have rotated if it's old. Generate a new one in the Azure portal.

### "Deployment not found" or similar 404

- Make sure your deployment name is spelled exactly as you named it (e.g., `gpt-5-1-mini-demo`).
- Make sure the deployment has finished provisioning (status should be "Succeeded" in the portal).

### "The request is not valid for the provided model"

- You might be using the wrong API version. Try `2024-08-01-preview` or `2024-10-01-preview`.
- Make sure you're sending the request to the `/openai/deployments/` endpoint, not a generic endpoint.

### "Too many requests" or 429 error

- You're hitting the rate limit. By default, the S0 SKU allows a certain number of requests per minute. Wait a moment and try again.

## Accessing an Existing Project

If your organization already has a Foundry project set up and you just need access to it:

1. Ask the project administrator for:
   - The **project endpoint** (URL starting with `https://`)
   - The **deployment name** of the model you want to use
   - An **API key** (or create your own in the Azure portal if you have permissions)
2. Use the endpoint and API key exactly as shown in Step 8.

If you don't see a Foundry project in the portal, check with your admin about RBAC permissions.

## What's Next

You've now got:

- ✅ A Foundry project
- ✅ A deployed model
- ✅ An endpoint that responds to requests

In Part 3, we'll build a simple agent on top of this foundation: one that can actually do things beyond chat. We'll add tools, give it grounding data, and turn this dumb pipe into something that actually thinks.

For now, bookmark your endpoint and API key. You're going to need them.

