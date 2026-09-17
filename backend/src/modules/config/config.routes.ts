import { Router } from "express";
import { publicConfigController } from "./config.controller.js";

export const configRoutes = Router();

configRoutes.get("/public", publicConfigController);
