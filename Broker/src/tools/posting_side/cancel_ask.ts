import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { checkToolScope } from "../../utils/scopes.js";
import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types";

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
  cb: async (
    args: CancelAskInput,
    authInfo?: AuthInfo,
  ): Promise<CallToolResult> => {
    const scopeError = checkToolScope("cancel_ask", authInfo?.scopes ?? []);
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
