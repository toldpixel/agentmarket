// client-gateway/src/services/gateway.service.ts
import * as grpc from "@grpc/grpc-js";
import { jobStore } from "../store/job.store.ts";
import { JobContract, JobType } from "../types/job.ts";

export class GatewayService {
  // ── place_ask ─────────────────────────────────────────────────────────────
  async PlaceAsk(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    try {
      const { job_type, input, validator, reward, deadline, poster_id } =
        call.request;

      const job: JobContract = {
        jobId: crypto.randomUUID(),
        jobType: job_type as JobType,
        input: JSON.parse(input),
        validator,
        reward,
        deadline,
        posterId: poster_id,
        status: "open",
        createdAt: Date.now(),
      };

      jobStore.addJob(job);

      callback(null, { job_id: job.jobId, status: "OPEN" });
    } catch (err) {
      console.error("[gateway] PlaceAsk error:", err);
      callback({
        code: grpc.status.INTERNAL,
        message: `Failed to place ask: ${err}`,
      });
    }
  }
}

const svc = new GatewayService();

// converted implementation for addService(service, implementation) in server.ts
export const gatewayServiceImpl = {
  PlaceAsk: svc.PlaceAsk.bind(svc),
};
