import { SkillSymbolSchema } from "../../types/order.js";
import type { SkillSymbol } from "../../types/order.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

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
  cb: async ({
    skillSymbol,
    depth,
  }: z.infer<typeof schema>): Promise<CallToolResult> => {
    // return top N bids and asks with EAP scores
    return { content: [{ type: "text", text: "..." }] };
  },
};
