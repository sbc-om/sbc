import "dotenv/config";

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createBusinessReviewMcpServer } from "../src/lib/mcp/businessReviewServer";

async function main() {
  const server = createBusinessReviewMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Failed to start SBC business review MCP server.", error);
  process.exit(1);
});