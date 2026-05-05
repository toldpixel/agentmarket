import express from "express";
import { router as mcpRouter } from "./mcp_endpoints.js";
import { router as registrationRouter } from "./registration.js";

const router = express.Router();

router.use(mcpRouter);
router.use(registrationRouter);

export { router };
