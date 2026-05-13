// src/types/job.ts

export type JobType =
  | "broken_link_check"
  | "email_validation"
  | "webpage_to_markdown"
  | "domain_availability"
  | "keyword_extraction"
  | "language_detection"
  | "readability_score"
  | "duplicate_detection";

// input schemas per job type
export const JOB_INPUT_SCHEMAS: Record<JobType, object> = {
  broken_link_check: { urls: "string[]" },
  email_validation: { emails: "string[]" },
  webpage_to_markdown: { url: "string" },
  domain_availability: { domains: "string[]" },
  keyword_extraction: { text: "string" },
  language_detection: { texts: "string[]" },
  readability_score: { text: "string" },
  duplicate_detection: { strings: "string[]" },
};

// output schemas per job type
export const JOB_OUTPUT_SCHEMAS: Record<JobType, object> = {
  broken_link_check: [{ url: "string", status: "number" }],
  email_validation: [{ email: "string", valid: "boolean" }],
  webpage_to_markdown: { markdown: "string" },
  domain_availability: [{ domain: "string", available: "boolean" }],
  keyword_extraction: { keywords: "string[]" },
  language_detection: [{ text: "string", language: "string" }],
  readability_score: { score: "number", grade_level: "string" },
  duplicate_detection: [{ a: "string", b: "string", similarity: "number" }],
};

export interface JobContract {
  jobId: string;
  jobType: JobType;
  input: Record<string, unknown>;
  validator: string; // self-contained validation script
  reward: number; // tokens/credits
  deadline: number; // unix timestamp
  posterId: string; // agent client_id
  status: JobStatus;
  createdAt: number;
}

export type JobStatus =
  | "open" // posted, awaiting bids
  | "matched" // bid accepted, assigned to worker
  | "submitted" // worker submitted result
  | "validated" // validator passed
  | "completed" // poster approved, reward released
  | "failed" // validator failed or deadline missed
  | "cancelled"; // poster cancelled
