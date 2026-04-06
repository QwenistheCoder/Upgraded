import { Request, Response, NextFunction } from "express";
import { UsersService } from "./users.service";
import { getDb } from "../../config/database";

const usersService = new UsersService(getDb()!);

export const getMe = (req: Request, res: Response, _next: NextFunction) => {
  const userId = req.user!.id;
  const profile = usersService.getUserProfile(userId);
  if (!profile) return res.status(404).json({ error: "User not found" });
  return res.status(200).json(profile);
};

export const updateMe = (req: Request, res: Response, _next: NextFunction) => {
  const userId = req.user!.id;
  const profile = usersService.updateUserProfile(userId, req.body);
  return res.status(200).json(profile);
};

export const getApiKeys = (req: Request, res: Response, _next: NextFunction) => {
  const userId = req.user!.id;
  const keys = usersService.getApiKeys(userId);
  return res.status(200).json(keys.map((k) => ({ id: k.id, provider: k.provider, created_at: k.created_at })));
};

export const saveApiKey = (req: Request, res: Response, _next: NextFunction) => {
  const userId = req.user!.id;
  const { provider, encrypted_key } = req.body;
  if (!provider || !encrypted_key) {
    return res.status(400).json({ error: "provider and encrypted_key are required" });
  }
  const key = usersService.saveApiKey(userId, { provider, encryptedKey: encrypted_key });
  return res.status(201).json({ id: key.id, provider: key.provider, created_at: key.created_at });
};

export const deleteApiKey = (req: Request, res: Response, _next: NextFunction) => {
  const userId = req.user!.id;
  const provider = req.params.provider as string;
  usersService.deleteApiKey(userId, provider);
  return res.status(204).send();
};

export const getCustomProviders = (req: Request, res: Response, _next: NextFunction) => {
  const userId = req.user!.id;
  const providers = usersService.getCustomProviders(userId);
  return res.status(200).json(providers);
};

export const saveCustomProvider = (req: Request, res: Response, _next: NextFunction) => {
  const userId = req.user!.id;
  const provider = usersService.saveCustomProvider(userId, req.body);
  return res.status(201).json(provider);
};

export const updateCustomProvider = (req: Request, res: Response, _next: NextFunction) => {
  const userId = req.user!.id;
  const id = req.params.id as string;
  const provider = usersService.updateCustomProvider(userId, id, req.body);
  return res.status(200).json(provider);
};

export const deleteCustomProvider = (req: Request, res: Response, _next: NextFunction) => {
  const userId = req.user!.id;
  const id = req.params.id as string;
  usersService.deleteCustomProvider(userId, id);
  return res.status(204).send();
};
