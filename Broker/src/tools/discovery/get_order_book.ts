import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { checkToolScope, requireToolScope } from "../../utils/scopes.js";

const schema = z.object({
  skillSymbol: z
    .string()
    .regex(/^[A-Z_]+\.[A-Z]+$/)
    .describe("e.g. NLP.SENIOR, DEVOPS.MID"),
  depth: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10)
    .describe("Number of price levels to return"),
});

export const getOrderBook = {
  name: "get_order_book",
  config: {
    description: "Get current bids and asks for a skill category",
    inputSchema: schema,
  },
  cb: async (
    { skillSymbol, depth }: z.infer<typeof schema>,
    authInfo?: AuthInfo,
  ): Promise<CallToolResult> => {
    //requireToolScope("get_order_book", authInfo?.scopes ?? []);
    const scopeError = checkToolScope("get_order_book", authInfo?.scopes ?? []);
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
