import { Router } from "express";
import {
  registerController,
  loginController,
  logoutController,
  meController,
  updateProfileController,
  changePasswordController,
  forgotPasswordController,
  resetPasswordController,
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
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.schema.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";

export const authRoutes = Router();

authRoutes.post("/register", validateBody(registerSchema), registerController);
authRoutes.post("/login", validateBody(loginSchema), loginController);
authRoutes.post("/refresh", refreshController);
authRoutes.post("/logout", logoutController);
authRoutes.post("/verify-email", validateBody(verifyEmailSchema), verifyEmailController);
authRoutes.post("/resend-verification", validateBody(resendVerificationSchema), resendVerificationController);
authRoutes.post("/forgot-password", validateBody(forgotPasswordSchema), forgotPasswordController);
authRoutes.post("/reset-password", validateBody(resetPasswordSchema), resetPasswordController);
authRoutes.get("/me", authMiddleware, meController);
authRoutes.patch("/me", authMiddleware, validateBody(updateProfileSchema), updateProfileController);
authRoutes.post("/change-password", authMiddleware, validateBody(changePasswordSchema), changePasswordController);
