---
title: "Model Context Protocol (MCP): Architecture, Transports, and Tool Calling in Practice"
description: "A technical breakdown of the Model Context Protocol (MCP), covering client-host-server topology, stdio vs. SSE transports, schema negotiation, and tool execution lifecycles."
publishedDate: "2026-09-01"
updatedDate: "2026-09-01"
tags: ["Model Context Protocol", "MCP", "AI Agents", "LLM Architecture", "Tool Calling", "Python", "TypeScript"]
---

## The Need for Standardized Agent Interfaces

Before the Model Context Protocol (MCP), integrating external data sources and tools into AI applications was fragmented. Every framework—LangChain, Semantic Kernel, AutoGen, or custom agent runtimes—maintained bespoke abstractions for tool schemas, authentication, and execution lifecycles.

When a team built an integration for GitHub, PostgreSQL, or Jira, that code was tightly coupled to their specific framework.

MCP standardizes this layer using an open, JSON-RPC 2.0-based protocol. It decouples **AI Hosts** (IDE extensions, agent runtimes, chat interfaces) from **MCP Servers** (tools, file access, database connectors, and enterprise services).

```text
┌────────────────────────────────────────────────────────┐
│                   AI Host Application                  │
│       (Cursor, VS Code, Claude Desktop, AGY Agent)     │
└───────────┬────────────────────────────────┬───────────┘
            │ stdio                          │ SSE / HTTP
            ▼                                ▼
┌────────────────────────┐      ┌────────────────────────┐
│    Local MCP Server    │      │    Remote MCP Server   │
│  (Filesystem, Git CLI) │      │  (Postgres, Jira API)  │
└────────────────────────┘      └────────────────────────┘
```

---

## MCP Architecture and Roles

The protocol defines three core participants:

1. **Host**: The application coordinating user interactions, LLM inference, and UI state.
2. **Client**: A protocol client embedded inside the Host that maintains 1:1 stateful connections to individual MCP servers.
3. **Server**: A lightweight process exposing tools, prompts, and resources over a standard transport.

### Core Capabilities

MCP servers expose three primary primitive types to clients:

- **Tools (`tools/list`, `tools/call`)**: Executable functions that the model can invoke with structured JSON Schema arguments.
- **Resources (`resources/list`, `resources/read`)**: Static or dynamic data context (like file contents, database tables, or application state) that clients can attach directly into prompts.
- **Prompts (`prompts/list`, `prompts/get`)**: Reusable prompt templates and workflows managed server-side.

---

## Protocol Transports: stdio vs. Server-Sent Events (SSE)

MCP supports two standard transport layers depending on deployment topology:

### 1. Standard Input/Output (`stdio`)
Used for local tool execution where the Host spawns the server as a child process.

- **Communication**: Messages are sent as newline-delimited JSON-RPC packets over `stdin` and `stdout`.
- **Diagnostics**: Server logs MUST go to `stderr` to avoid corrupting protocol packets on `stdout`.
- **Security**: Bound to local process permissions; zero network surface area.

```text
Host (Parent Process)
      │  Write JSON-RPC via stdin
      ├──────────────────────────────►  Server (Child Process)
      │  Read JSON-RPC via stdout
      ◄──────────────────────────────┤
      │  Diagnostic logs via stderr
      ◄──────────────────────────────┘
```

### 2. HTTP with Server-Sent Events (SSE)
Used when servers run remotely, inside Docker containers, or as shared microservices.

- **Client to Server**: HTTP POST requests for client-initiated RPC messages.
- **Server to Client**: Long-lived HTTP SSE connection streaming server-sent notifications and tool events.

---

## Lifecycle of an MCP Tool Invocation

When an agent needs to execute an action, the interaction follows a deterministic sequence:

```text
Host / Agent                  MCP Client                   MCP Server
     │                            │                            │
     │ 1. Initialize Connection   │                            │
     ├───────────────────────────►│ 2. initialize request      │
     │                            ├───────────────────────────►│
     │                            │ 3. capabilities & version  │
     │                            │◄───────────────────────────┤
     │                            │                            │
     │ 4. Request Tool Manifest   │                            │
     ├───────────────────────────►│ 5. tools/list              │
     │                            ├───────────────────────────►│
     │                            │ 6. schemas & tool list     │
     │                            │◄───────────────────────────┤
     │                            │                            │
     │ 7. LLM requests tool call  │                            │
     ├───────────────────────────►│ 8. tools/call (name, args) │
     │                            ├───────────────────────────►│
     │                            │ 9. tool execution result   │
     │ 10. Process result in loop │◄───────────────────────────┤
     │◄───────────────────────────┤                            │
```

---

## Building a Production MCP Server in Python

Using the official Python FastMCP framework, you can define structured tools with full type validation:

```python
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, Field

# Initialize server
mcp = FastMCP("database-inspector")

class TableInspectionQuery(BaseModel):
    table_name: str = Field(
        description="The SQL table name to inspect"
    )
    include_indexes: bool = Field(
        default=False, 
        description="Whether to include index definitions"
    )

@mcp.tool()
async def inspect_table_schema(query: TableInspectionQuery) -> str:
    """Inspect schema definitions and column types for a target table."""
    # Deterministic query execution logic
    schema_info = f"Schema for {query.table_name}: [id: int, name: text, created_at: timestamp]"
    if query.include_indexes:
        schema_info += "\nIndexes: [idx_table_created_at on (created_at DESC)]"
    return schema_info

if __name__ == "__main__":
    mcp.run(transport="stdio")
```

---

## Best Practices for MCP Implementations

1. **Keep Tool Payloads Concise**: Tool outputs enter the LLM context window. Return structured, concise JSON or markdown summaries rather than raw megabyte-scale database dumps.
2. **Handle Errors Gracefully in JSON-RPC**: Tool failures should return structured error text within the tool result payload rather than crashing the protocol process.
3. **Never Poll over Transports**: Rely on asynchronous event handlers and notifications rather than polling server state in tight loops.
4. **Isolate Environment Secrets**: Pass credentials to MCP servers via environment variables during process launch rather than hardcoding tokens into tool arguments.

The Model Context Protocol establishes a clean boundary between intelligence and execution, turning tools into swappable, composable primitives across the AI ecosystem.
