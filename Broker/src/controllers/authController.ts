import type { Response, Request } from "express";
import { mcpServerUrl } from "../auth/auth.js";

export const metaDataRoute = async (req: Request, res: Response) => {
  try {
    res.json({
      resource: mcpServerUrl.toString(),
      authorization_servers: [`https://auth.luchsnode.com/realms/exchange`],
    });
    return;
  } catch (error) {
    console.error("Error auth metadata", error);
  }
};
