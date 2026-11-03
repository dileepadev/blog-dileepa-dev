---
title: "Model Context Protocol (MCP): Architecture, Transports, and Tool Calling in Practice"
description: "A technical breakdown of the Model Context Protocol (MCP), covering client-host-server topology, stdio and Streamable HTTP transports, stateless requests, and the tool-call lifecycle."
publishedDate: "2026-09-01"
updatedDate: "2026-11-04"
tags: ["Model Context Protocol", "MCP", "AI Agents", "LLM Architecture", "Tool Calling", "Python", "TypeScript"]
---

> **Updated 4 November 2026** for the 2026-07-28 MCP specification and the official Python SDK v2. The protocol is now stateless, with no `initialize` handshake, and Streamable HTTP is the remote transport.

## The Need for Standardized Agent Interfaces

Before the Model Context Protocol (MCP), integrating external data sources and tools into AI applications was fragmented. Every framework—LangChain, Semantic Kernel, AutoGen, or custom agent runtimes—maintained bespoke abstractions for tool schemas, authentication, and execution lifecycles.

When a team built an integration for GitHub, PostgreSQL, or Jira, that code was tightly coupled to their specific framework.

MCP standardizes this layer using an open, JSON-RPC 2.0-based protocol. It decouples **AI Hosts** (IDE extensions, agent runtimes, chat interfaces) from **MCP Servers** (tools, file access, database connectors, and enterprise services).

![MCP architecture: the host runs one MCP client per server, reaching local MCP servers over stdio and remote MCP servers over Streamable HTTP.](https://res.cloudinary.com/dileepadev/image/upload/v1793735947/api-dileepa-dev/blogs/y87kpned04oh7vflgdeh.svg)

---

## MCP Architecture and Roles

The protocol defines three core participants:

1. **Host**: The application coordinating user interactions, LLM inference, and UI state.
2. **Client**: A protocol client the Host creates for each MCP server, in a 1:1 relationship. It attaches the protocol version and its capabilities to every request.
3. **Server**: A lightweight process exposing tools, prompts, and resources over a standard transport.

MCP is **stateless**: every request is self-contained, and a server must not infer anything from earlier requests on the same connection. An open connection, even a stdio process, is not a session. State that spans requests is carried by an explicit identifier the client sends each time.

### Core Capabilities

MCP servers expose three primary primitive types to clients:

- **Tools (`tools/list`, `tools/call`)**: Executable functions that the model can invoke with structured JSON Schema arguments.
- **Resources (`resources/list`, `resources/read`)**: Static or dynamic data context (like file contents, database tables, or application state) that clients can attach directly into prompts.
- **Prompts (`prompts/list`, `prompts/get`)**: Reusable prompt templates and workflows managed server-side.

---

## Protocol Transports: stdio and Streamable HTTP

MCP defines two standard transports. The messages mean the same thing on both; only the framing and delivery differ.

### 1. Standard Input/Output (`stdio`)

Used for local tool execution, where the client launches the server as a subprocess.

- **Communication**: Newline-delimited JSON-RPC messages over `stdin` and `stdout`. A message must not contain an embedded newline.
- **Diagnostics**: The server must not write anything but MCP messages to `stdout`. It may write logs to `stderr`, which the client can capture, forward, or ignore; `stderr` output is not an error signal on its own.
- **Security**: Bound to local process permissions; zero network surface area.

![stdio transport: the host writes JSON-RPC to the server's stdin and reads JSON-RPC from its stdout; the server writes diagnostic logs to stderr](https://res.cloudinary.com/dileepadev/image/upload/v1793735958/api-dileepa-dev/blogs/itxrmtsgdrfmgkea8tbe.svg)

### 2. Streamable HTTP

Used when servers run remotely, inside containers, or as shared services.

- **Requests**: Every message is an HTTP POST to a single MCP endpoint.
- **Replies**: The server answers with a JSON object, or with a server-sent event stream scoped to that one request when it needs to send progress first.
- **Server-to-client input**: A server never sends its own requests. When it needs sampling, elicitation, or roots, it returns an `InputRequiredResult`, and the client retries the original request with the answers.

Streamable HTTP replaced the older HTTP+SSE transport from the 2024-11-05 specification, which has been deprecated since 2025-03-26. Use it only to support old clients.

---

## Lifecycle of an MCP Tool Invocation

There is no separate `initialize` handshake. Every request carries its protocol version and the client's capabilities in `_meta`, so a tool call starts with discovery:

1. The client sends `tools/list` and the server returns each tool's name, description, and JSON Schema.
2. The client offers those tools to the Host, which passes them to the model.
3. The model chooses a tool, and the client sends `tools/call` with its arguments.
4. The server returns the result, and the Host feeds it back into the agent loop.

A version mismatch fails that one request with `UnsupportedProtocolVersionError` rather than a failed handshake.

![Lifecycle of an MCP tool call under the 2026-07-28 specification: the client lists the server’s tools, the host chooses one, the client calls it and the result returns to the host. There is no initialize handshake; each request carries its protocol version and capabilities.](https://res.cloudinary.com/dileepadev/image/upload/v1793735968/api-dileepa-dev/blogs/f24ebhsnhfhi8yx4lw9r.svg)

---

## Building a Production MCP Server in Python

Using `MCPServer` from the official Python SDK (v2), you can define structured tools with full type validation. In SDK v1 this class was `FastMCP`, imported from `mcp.server.fastmcp`; that path is gone in v2.

```python
from mcp.server import MCPServer
from pydantic import BaseModel, Field

# Create the server
mcp = MCPServer("database-inspector")

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
    mcp.run(transport="stdio")  # or "streamable-http" for a remote server
```

---

## Best Practices for MCP Implementations

1. **Keep Tool Payloads Concise**: Tool outputs enter the LLM context window. Return structured, concise JSON or markdown summaries rather than raw megabyte-scale database dumps.
2. **Handle Errors Gracefully in JSON-RPC**: Tool failures should return structured error text within the tool result payload rather than crashing the protocol process.
3. **Never Poll over Transports**: Subscribe to list-change notifications with `subscriptions/listen` rather than calling `tools/list` in a tight loop.
4. **Don't Treat a Connection as a Session**: Pass an explicit identifier for any state that must survive between requests; the protocol is stateless.
5. **Isolate Environment Secrets**: Pass credentials to MCP servers via environment variables during process launch rather than hardcoding tokens into tool arguments.

The Model Context Protocol establishes a clean boundary between intelligence and execution, turning tools into swappable, composable primitives across the AI ecosystem.
