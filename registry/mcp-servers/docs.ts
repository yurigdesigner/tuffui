import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { McpServers } from "@/components/ui/mcp-servers";

export function Connectors({ servers }: { servers: McpServer[] }) {
  return (
    <McpServers
      data={servers}
      onToggleTool={(serverId, tool, enabled) =>
        mcp.setToolEnabled(serverId, tool, enabled)
      }
      onToggleServer={(serverId, enabled) => mcp.setAllTools(serverId, enabled)}
      onAuthorize={(server) => mcp.startOAuth(server.id)} // opens the provider's consent page
      onReconnect={(server) => mcp.restart(server.id)}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "McpServer[]",
      required: true,
      description: "Servers in display order, each with its status and tools.",
    },
    {
      name: "view",
      type: '"servers" | "tools"',
      default: '"servers"',
      description:
        "Expandable servers with their tools, or one searchable list of every tool grouped by server.",
    },
    {
      name: "onToggleTool",
      type: "(serverId: string, tool: string, enabled: boolean) => void",
      description:
        "Called when a tool's switch flips. Tools are disabled unless the server is connected.",
    },
    {
      name: "onToggleServer",
      type: "(serverId: string, enabled: boolean) => void",
      description: "Called by the All tools switch inside an expanded server.",
    },
    {
      name: "onAuthorize",
      type: "(server: McpServer) => void",
      description: "Called by the Authorize button on servers that need auth.",
    },
    {
      name: "onReconnect",
      type: "(server: McpServer) => void",
      description: "Called by the Reconnect button on servers in the error state.",
    },
    {
      name: "defaultExpanded",
      type: "string",
      description: "Id of the server that starts expanded.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type McpServer = {
  id: string;
  name: string;
  transport: "stdio" | "http";
  status: "connected" | "connecting" | "needs-auth" | "error";
  error?: string; // shown on error rows
  tools: { name: string; description?: string; enabled: boolean }[];
};`,
};
