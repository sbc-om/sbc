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