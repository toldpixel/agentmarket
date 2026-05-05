import express from "express";
import {
  mcpPostHandler,
  mcpGetHandler,
  mcpDeleteHandler,
} from "../controllers/mcpController.js";
import { authMiddleware } from "../auth/auth.js";

export const router = express.Router();

router.post("/mcp", authMiddleware, mcpPostHandler);
router.get("/mcp", authMiddleware, mcpGetHandler);
router.delete("/mcp", authMiddleware, mcpDeleteHandler);
