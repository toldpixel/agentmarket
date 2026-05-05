import express from "express";
import { registerAgent } from "../controllers/registerController.js";

export const router = express.Router();

router.post("/agents/register", registerAgent);
