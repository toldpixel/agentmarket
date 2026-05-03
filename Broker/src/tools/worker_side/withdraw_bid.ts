import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

const inputSchema = z.object({
  bidId: z.string().uuid(),
  clientOrderId: z.string().uuid(),
});

type WithdrawBidInput = z.infer<typeof inputSchema>;

export const withdrawBid = {
  name: "withdraw_bid",
  config: {
    description: "Cancel an open bid before it is matched",
    inputSchema,
  },
  cb: async ({
    bidId,
    clientOrderId,
  }: WithdrawBidInput): Promise<CallToolResult> => {
    return { content: [{ type: "text", text: "..." }] };
  },
};
