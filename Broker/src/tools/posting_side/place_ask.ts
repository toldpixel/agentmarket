import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { checkToolScope } from "../../utils/scopes.js";
import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types";
import { grpcCall } from "../../client_gateway/client.js";

const inputSchema = z.object({
  jobType: z.enum([
    "broken_link_check",
    "email_validation",
    "webpage_to_markdown",
    "domain_availability",
    "keyword_extraction",
    "language_detection",
    "readability_score",
    "duplicate_detection",
  ]),
  input: z.record(z.string(), z.unknown()),
  validator: z
    .string()
    .min(1)
    .describe(
      "Self-contained script: function validate(output) { return 'pass' or 'fail' }",
    ),
  reward: z.number().positive(),
  deadline: z
    .number()
    .int()
    .positive()
    .describe("Unix timestamp — when the job expires"),
});

type PlaceAskInput = z.infer<typeof inputSchema>;

/**
 * Tool for placing a job
 */
export const placeAsk = {
  name: "place_ask",
  config: {
    description: "Poster lists a job requirement on the order book",
    inputSchema: inputSchema,
  },
  cb: async (
    { jobType, input, validator, reward, deadline }: PlaceAskInput,
    authInfo?: AuthInfo,
  ): Promise<CallToolResult> => {
    const scopeError = checkToolScope("place_ask", authInfo?.scopes ?? []);
    if (scopeError) {
      return { isError: true, content: [{ type: "text", text: scopeError }] };
    }

    const posterId = authInfo!.clientId;

    try {
      const response = await grpcCall<{ job_id: string; status: string }>(
        "PlaceAsk",
        {
          job_type: jobType,
          input: JSON.stringify(input),
          validator: validator,
          reward: reward,
          deadline: deadline,
          poster_id: posterId, // ← injected from token
        },
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              jobId: response.job_id,
              status: response.status,
              posterId,
            }),
          },
        ],
      };
    } catch (err) {
      console.error("[place_ask] gRPC error:", err);
      return {
        isError: true,
        content: [{ type: "text", text: `Failed to place ask: ${err}` }],
      };
    }
  },
};
