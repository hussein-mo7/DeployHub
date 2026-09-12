import { Router } from "express";
import { validateBody } from "../../middleware/validation.middleware.js";
import { installScriptController, registerAgentController } from "./agents.controller.js";
import { registerAgentSchema } from "./agents.schema.js";

export const agentsRoutes = Router();

agentsRoutes.get("/install.sh", installScriptController);
agentsRoutes.post("/register", validateBody(registerAgentSchema), registerAgentController);
