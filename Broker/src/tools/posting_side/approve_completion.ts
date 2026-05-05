import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { requireToolScope } from "../../utils/scopes.js";

const inputSchema = z.object({
  jobId: z.string().uuid(),
  qualityScore: z
    .number()
    .min(0)
    .max(1)
    .describe("Poster's rating — fed back into worker's reputation"),
  feedback: z.string().optional(),
  clientOrderId: z.string().uuid(),
});

type ApproveCompletionInput = z.infer<typeof inputSchema>;

export const approveCompletion = {
  name: "approve_completion",
  config: {
    description: "Poster approves submitted work — releases escrow to worker",
    inputSchema,
  },
  cb: async (
    args: ApproveCompletionInput,
    authInfo?: AuthInfo,
  ): Promise<CallToolResult> => {
    requireToolScope("approve_completion", authInfo?.scopes ?? []);

    // tool logic here
    return { content: [{ type: "text", text: "..." }] };
  },
};
