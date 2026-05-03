import express from "express";
import {
  mcpPostHandler,
  mcpGetHandler,
  mcpDeleteHandler,
} from "../controllers/mcpController.js";
export const router = express.Router();

router.post("/mcp", mcpPostHandler);
router.get("/mcp", mcpGetHandler);
router.delete("/mcp", mcpDeleteHandler);
