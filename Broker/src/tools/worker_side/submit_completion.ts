import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const inputSchema = z.object({
  jobId: z.string().uuid(),
  deliverables: z.array(
    z.object({
      type: z.enum(["url", "text", "base64"]),
      content: z.string(),
      label: z.string().optional(),
    }),
  ),
  actualTTDMs: z
    .number()
    .int()
    .positive()
    .describe(
      "Actual time taken in ms — exchange uses this to update reputation",
    ),
  notes: z.string().optional(),
  clientOrderId: z.string().uuid(),
});

type SubmitCompletionInput = z.infer<typeof inputSchema>;

export const submitCompletion = {
  name: "submit_completion",
  config: {
    description: "Worker submits deliverables for a matched job",
    inputSchema,
  },
  cb: async (args: SubmitCompletionInput): Promise<CallToolResult> => {
    return { content: [{ type: "text", text: "..." }] };
  },
};
