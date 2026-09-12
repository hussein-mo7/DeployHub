import { Router } from "express";
import {
  registerController,
  loginController,
  logoutController,
  meController,
  refreshController,
  verifyEmailController,
  resendVerificationController,
} from "./auth.controller.js";
import { validateBody } from "../../middleware/validation.middleware.js";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from "./auth.schema.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";

export const authRoutes = Router();

authRoutes.post("/register", validateBody(registerSchema), registerController);
authRoutes.post("/login", validateBody(loginSchema), loginController);
authRoutes.post("/refresh", refreshController);
authRoutes.post("/logout", logoutController);
authRoutes.post("/verify-email", validateBody(verifyEmailSchema), verifyEmailController);
authRoutes.post("/resend-verification", validateBody(resendVerificationSchema), resendVerificationController);
authRoutes.get("/me", authMiddleware, meController);
