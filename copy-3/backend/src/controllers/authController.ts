import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthUtils } from '../utils/auth';
import prisma from '../config/database';
import { ApiResponse } from '../types';

export class AuthController {
  static registerValidation = [
    body('email').isEmail().normalizeEmail(),
    body('name').trim().isLength({ min: 2, max: 100 }),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    body('role').optional().isIn(['ADMIN', 'VIEWER']),
  ];

  static loginValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ];

  static async register(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const { email, name, password, role = 'VIEWER' } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          error: 'User with this email already exists'
        });
        return;
      }

      // Hash password
      const passwordHash = await AuthUtils.hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: role as 'ADMIN' | 'VIEWER'
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true
        }
      });

      // Generate token
      const token = AuthUtils.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      const response: ApiResponse = {
        success: true,
        data: {
          user,
          token
        },
        message: 'User registered successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
        return;
      }

      // Verify password
      const isValidPassword = await AuthUtils.comparePassword(password, user.passwordHash);
      
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
        return;
      }

      // Generate token
      const token = AuthUtils.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      const response: ApiResponse = {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt
          },
          token
        },
        message: 'Login successful'
      };

      res.json(response);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      
      const response: ApiResponse = {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}
