# SBC Business Review MCP

This MCP server exposes SBC business data so an AI client can inspect member businesses and generate structured review output.

## What it provides

- `list_member_businesses`: list businesses with approval and search filters
- `get_member_business`: fetch one business by `id` or `slug`
- `review_member_businesses`: run heuristic review and optional AI review on a selected group of businesses

## Run

1. Install dependencies:

```bash
pnpm install
```

2. Ensure database environment variables are present in `.env`.

3. Optional: configure AI review variables:

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

4. Start the MCP server:

```bash
pnpm mcp:business-review
```

## Public endpoint

If the app is deployed publicly, the MCP is also available over HTTP at:

```text
/api/mcp/business-review
```

Info / health endpoint:

```text
/api/mcp/business-review/info
```

Example remote MCP config:

```json
{
  "mcpServers": {
    "sbc-business-review": {
      "type": "streamable-http",
      "url": "https://your-domain.com/api/mcp/business-review"
    }
  }
}
```

If API key protection is enabled:

```json
{
  "mcpServers": {
    "sbc-business-review": {
      "type": "streamable-http",
      "url": "https://your-domain.com/api/mcp/business-review",
      "headers": {
        "x-api-key": "YOUR_MCP_BUSINESS_REVIEW_API_KEY"
      }
    }
  }
}
```

## Ready-made client configs

Claude Desktop / compatible JSON config:

```json
{
  "mcpServers": {
    "sbc-business-review": {
      "type": "streamable-http",
      "url": "https://your-domain.com/api/mcp/business-review"
    }
  }
}
```

Cursor project/workspace MCP config:

```json
{
  "mcpServers": {
    "sbc-business-review": {
      "url": "https://your-domain.com/api/mcp/business-review"
    }
  }
}
```

## Operational checks

- Open `/api/mcp/business-review/info` to confirm database connectivity and endpoint availability.
- Use the public HTTP endpoint for remote clients.
- Use `pnpm mcp:business-review` when you want a local stdio server instead.
- Optional: protect the public endpoint with `MCP_BUSINESS_REVIEW_API_KEY` and `MCP_BUSINESS_REVIEW_REQUIRE_API_KEY=true`.
- Optional: tune request limits with `MCP_BUSINESS_REVIEW_RATE_LIMIT_MAX` and `MCP_BUSINESS_REVIEW_RATE_LIMIT_WINDOW_MS`.

## Example MCP client config

```json
{
  "mcpServers": {
    "sbc-business-review": {
      "command": "pnpm",
      "args": ["mcp:business-review"],
      "cwd": "/absolute/path/to/sbc"
    }
  }
}
```

## Notes

- The server uses stdio transport.
- `.env` is loaded automatically via `dotenv/config`.
- If `OPENAI_API_KEY` is not configured, `review_member_businesses` still returns heuristic review output.