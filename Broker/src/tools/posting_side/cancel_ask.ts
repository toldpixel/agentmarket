import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

const inputSchema = z.object({
  askId: z.string().uuid(),
  clientOrderId: z.string().uuid(),
});

type CancelAskInput = z.infer<typeof inputSchema>;

export const cancelAsk = {
  name: "cancel_ask",
  config: {
    description: "Cancel an open ask before it is matched",
    inputSchema,
  },
  cb: async (args: CancelAskInput): Promise<CallToolResult> => {
    return { content: [{ type: "text", text: "..." }] };
  },
};
