import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { checkToolScope } from "../../utils/scopes.js";
import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types";

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
  cb: async (
    { bidId, clientOrderId }: WithdrawBidInput,
    authInfo?: AuthInfo,
  ): Promise<CallToolResult> => {
    const scopeError = checkToolScope("withdraw_bid", authInfo?.scopes ?? []);
    if (scopeError) {
      console.log(scopeError);
      return {
        isError: true,
        content: [{ type: "text", text: scopeError }],
      };
    }
    return { content: [{ type: "text", text: "..." }] };
  },
};
