import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { gatewayServiceImpl } from "./services/gateway.service.js";

const packageDef = protoLoader.loadSync(path.resolve("proto/gateway.proto"), {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
});

const proto = grpc.loadPackageDefinition(packageDef) as any;

const server = new grpc.Server();

server.addService(proto.gateway.ClientGateway.service, gatewayServiceImpl);

const GRPC_PORT = process.env.GRPC_PORT || "50051";

server.bindAsync(
  `0.0.0.0:${GRPC_PORT}`,
  grpc.ServerCredentials.createInsecure(), // internal network — no TLS needed
  (err, port) => {
    if (err) {
      console.error("[gateway] failed to start:", err);
      process.exit(1);
    }
    console.log(`[gateway] gRPC server listening on port ${port}`);
  },
);
