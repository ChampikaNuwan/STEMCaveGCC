import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AuthRequest, JwtPayload, UserRole } from '../types';

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication failed: Token missing' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Authentication failed: Invalid token' });
  }
}

export function authorize(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

// Roles that can manage users
export const USER_MANAGERS: UserRole[] = ['superadmin', 'admin', 'teacher'];

// Who can create which roles
export const ROLE_CREATION_RULES: Record<UserRole, UserRole[]> = {
  superadmin: ['superadmin', 'admin', 'teacher', 'student'],
  admin: ['admin', 'teacher', 'student'],
  teacher: ['student'],
  student: [],
};

export function canCreateRole(creatorRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_CREATION_RULES[creatorRole]?.includes(targetRole) ?? false;
}
