// client-gateway/src/store/job.store.ts
import { JobContract, JobType } from "../types/job.js";

class JobStore {
  // order book — open jobs by type
  private orderBook = new Map<JobType, JobContract[]>();

  // all jobs by id
  private jobs = new Map<string, JobContract>();

  // ── Ask side ──────────────────────────────────────────────────────────────

  addJob(job: JobContract): void {
    this.jobs.set(job.jobId, job);

    if (!this.orderBook.has(job.jobType)) {
      this.orderBook.set(job.jobType, []);
    }
    this.orderBook.get(job.jobType)!.push(job);

    console.log(`[store] job added: ${job.jobId} type=${job.jobType}`);
  }
}

export const jobStore = new JobStore();
