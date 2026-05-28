import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { UserModel } from '../models/user.model';
import { AuthRequest, UserRole } from '../types';
import { canCreateRole } from '../middlewares/auth';

export const AuthController = {
  async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { usernameOrEmail, password } = req.body;

      if (!usernameOrEmail || !password) {
        res.status(400).json({ success: false, message: 'Username/email and password are required' });
        return;
      }

      const user = await UserModel.findByEmailOrUsername(usernameOrEmail);
      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
      }

      const isValid = await UserModel.verifyPassword(user, password);
      if (!isValid) {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn } as any
      );

      res.json({
        success: true,
        token,
        user: { id: user.id, username: user.username, email: user.email, role: user.role },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { username, email, role, password } = req.body;
      const creator = req.user!;

      // Validate required fields
      if (!username || !email || !role || !password) {
        res.status(400).json({ success: false, message: 'All fields are required' });
        return;
      }

      // Validate username length
      if (username.length < 3 || username.length > 50) {
        res.status(400).json({ success: false, message: 'Username must be 3-50 characters' });
        return;
      }

      // Validate password strength
      if (password.length < 6) {
        res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        return;
      }

      // Check permission to create this role
      if (!canCreateRole(creator.role, role as UserRole)) {
        res.status(403).json({
          success: false,
          message: `You do not have permission to create users with role: ${role}`,
        });
        return;
      }

      // Check existing email/username
      const existingEmail = await UserModel.findByEmail(email);
      if (existingEmail) {
        res.status(409).json({ success: false, message: 'Email already in use' });
        return;
      }

      const existingUsername = await UserModel.findByUsername(username);
      if (existingUsername) {
        res.status(409).json({ success: false, message: 'Username already in use' });
        return;
      }

      const userId = await UserModel.create({
        username,
        email,
        password,
        role: role as UserRole,
        createdBy: creator.id,
      });

      res.status(201).json({ success: true, userId });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await UserModel.findById(req.user!.id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      const { password_hash, ...safeUser } = user;
      res.json({ success: true, user: safeUser });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { role, limit, offset } = req.query;
      const users = await UserModel.getAll(
        role as UserRole | undefined,
        Number(limit) || 50,
        Number(offset) || 0
      );

      const safeUsers = users.map(({ password_hash, ...u }) => u);
      res.json({ success: true, users: safeUsers });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getUserById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await UserModel.findById(req.params.id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      const { password_hash, ...safeUser } = user;
      res.json({ success: true, user: safeUser });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const targetUser = await UserModel.findById(req.params.id);
      if (!targetUser) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // Check permission hierarchy
      if (!canCreateRole(req.user!.role, targetUser.role)) {
        res.status(403).json({ success: false, message: 'Cannot delete users with this role' });
        return;
      }

      await UserModel.delete(req.params.id);
      res.json({ success: true, message: 'User deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
