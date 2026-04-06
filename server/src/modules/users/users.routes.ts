import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import {
  getMe,
  updateMe,
  getApiKeys,
  saveApiKey,
  deleteApiKey,
  getCustomProviders,
  saveCustomProvider,
  updateCustomProvider,
  deleteCustomProvider,
} from "./users.controller";

const router = Router();

router.use(requireAuth);

// Profile
router.get("/me", getMe);
router.put("/me", updateMe);

// API Keys
router.get("/me/api-keys", getApiKeys);
router.post("/me/api-keys", saveApiKey);
router.delete("/me/api-keys/:provider", deleteApiKey);

// Custom Providers
router.get("/me/custom-providers", getCustomProviders);
router.post("/me/custom-providers", saveCustomProvider);
router.put("/me/custom-providers/:id", updateCustomProvider);
router.delete("/me/custom-providers/:id", deleteCustomProvider);

export default router;
