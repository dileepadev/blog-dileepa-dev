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
        slug: "2026-08-06-zero-to-agent-microsoft-foundry-series-kickoff",
      },
      {
        order: 2,
        title: "Your First Foundry Project and Model Deployment",
        blurb:
          "Create a Foundry resource and project, deploy a model from the catalog, and call it from code in about 10 minutes.",
      },
      {
        order: 3,
        title: "Building Your First Agent",
        blurb:
          "Prompt agents vs. hosted agents: build one in the Foundry portal, give it instructions, and talk to it in the playground.",
      },
      {
        order: 4,
        title: "Picking the Right Model",
        blurb:
          "A practical tour of the Foundry model catalog, and how to choose between GPT, Llama, DeepSeek, and the rest without guessing.",
      },
      {
        order: 5,
        title: "Giving Your Agent Tools and Knowledge",
        blurb:
          "Wire up File Search, Bing grounding, and your own data so answers are grounded instead of guessed.",
      },
      {
        order: 6,
        title: "Multi-Agent Systems",
        blurb:
          "Orchestrating multiple agents with Agent Framework, LangGraph, and MCP servers instead of one giant prompt.",
      },
      {
        order: 7,
        title: "Observability: Tracing and Evaluating Agents",
        blurb:
          "Turning on tracing, reading evaluation scores, and actually debugging an agent that misbehaves.",
      },
      {
        order: 8,
        title: "Locking It Down for Production",
        blurb:
          "Microsoft Entra identity, RBAC, network isolation, and the governance checklist before you ship.",
      },
    ],
  },
};
