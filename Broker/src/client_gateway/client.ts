// broker/src/gateway/client.ts
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";

const packageDef = protoLoader.loadSync(path.resolve("proto/gateway.proto"), {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
});

const proto = grpc.loadPackageDefinition(packageDef) as any;

export const gatewayClient = new proto.gateway.ClientGateway(
  process.env.GATEWAY_GRPC_URL || "client-gateway:50051",
  grpc.credentials.createInsecure(), // internal network — no TLS needed
);

// promisify for async/await
export function grpcCall<T>(method: string, request: object): Promise<T> {
  return new Promise((resolve, reject) => {
    gatewayClient[method](request, (err: any, response: T) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
}
