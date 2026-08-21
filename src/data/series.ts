export interface SeriesPart {
  order: number;
  title: string;
  blurb: string;
  slug?: string;
}

export interface Series {
  key: string;
  title: string;
  description: string;
  parts: SeriesPart[];
}

export const seriesRegistry: Record<string, Series> = {
  "microsoft-foundry": {
    key: "microsoft-foundry",
    title: "Zero to Agent: A Microsoft Foundry Series",
    description:
      "A hands-on walkthrough of Microsoft Foundry, from your first project to a production-ready agent. Practical steps over reference docs.",
    parts: [
      {
        order: 1,
        title: "Kicking Off the Series (and What We'll Build)",
        blurb:
          "Why this series exists, what Microsoft Foundry actually is in one page, and the roadmap for everything that follows.",
        slug: "2026-08-06-part-1-kicking-off-the-series",
      },
      {
        order: 2,
        title: "Your First Foundry Project and Model Deployment",
        blurb:
          "Create a Foundry resource and project, deploy a model from the catalog, and call it from code in about 10 minutes.",
        slug: "2026-08-12-part-2-your-first-foundry-project",
      },
      {
        order: 3,
        title: "Building Your First Agent",
        blurb:
          "Prompt agents vs. hosted agents: build one in the Foundry portal, give it instructions, and talk to it in the playground.",
        slug: "2026-08-13-part-3-building-your-first-agent",
      },
      {
        order: 4,
        title: "Picking the Right Model",
        blurb:
          "A practical tour of the Foundry model catalog, and how to choose between GPT, Llama, DeepSeek, and the rest without guessing.",
        slug: "2026-08-14-part-4-picking-the-right-model",
      },
      {
        order: 5,
        title: "Giving Your Agent Tools and Knowledge",
        blurb:
          "Wire up File Search, Bing grounding, and your own data so answers are grounded instead of guessed.",
        slug: "2026-08-15-part-5-giving-your-agent-tools-and-knowledge",
      },
      {
        order: 6,
        title: "Multi-Agent Systems",
        blurb:
          "Orchestrating multiple agents with Agent Framework, LangGraph, and MCP servers instead of one giant prompt.",
        slug: "2026-08-16-part-6-multi-agent-systems",
      },
      {
        order: 7,
        title: "Observability: Tracing and Evaluating Agents",
        blurb:
          "Turning on tracing, reading evaluation scores, and actually debugging an agent that misbehaves.",
        slug: "2026-08-17-part-7-tracing-and-evaluating-agents",
      },
      {
        order: 8,
        title: "Locking It Down for Production",
        blurb:
          "Microsoft Entra identity, RBAC, network isolation, and the governance checklist before you ship.",
        slug: "2026-08-18-part-8-locking-it-down-for-production",
      },
    ],
  },
};
