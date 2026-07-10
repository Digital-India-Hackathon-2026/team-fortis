import { AuthService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { BadRequestError } from '../utils/apiError.js';
import { prisma } from '../config/database.js';

export class AuthController {
  static async register(req, res, next) {
    try {
      const { name, username, password } = req.body;
      if (!name || !username || !password) {
        throw new BadRequestError('Name, username, and password are required');
      }

      const result = await AuthService.registerCitizen(req.body);
      res.status(201).json(new ApiResponse(201, result, 'Citizen registered successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { username, password, type } = req.body;
      if (!username || !password || !type) {
        throw new BadRequestError('Username, password, and login type are required');
      }

      const result = await AuthService.login(username, password, type);
      res.status(200).json(new ApiResponse(200, result, 'Login successful'));
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await AuthService.logout(refreshToken);
      res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async otpVerify(req, res, next) {
    try {
      const { email, role, name, phone } = req.body;
      if (!email) {
        throw new BadRequestError('Email is required');
      }

      let account = null;

      if (email === 'admin@civiq.gov' || role === 'admin') {
        account = await prisma.user.findFirst({
          where: { role: 'ADMIN' }
        });
      } else if (email === 'officer@civiq.gov' || role === 'officer') {
        account = await prisma.officer.findFirst({
          include: { department: true }
        });
      } else if (email === 'citizen@civiq.gov' || role === 'citizen') {
        account = await prisma.user.findFirst({
          where: { role: 'CITIZEN' }
        });
      } else {
        const username = email.split('@')[0];
        account = await prisma.user.findUnique({
          where: { username }
        });

        if (!account) {
          account = await prisma.user.create({
            data: {
              name: name || username,
              username,
              phone: phone || null,
              passwordHash: 'hash_otp_created',
              role: 'CITIZEN'
            }
          });
        }
      }

      if (!account) {
        throw new BadRequestError('Target mock account not found. Please run seed script first.');
      }

      const token = 'mock_jwt_token_for_' + account.id;

      res.status(200).json({
        user: {
          id: account.id,
          name: account.name,
          username: account.username,
          email: email,
          phone: account.phone || '',
          role: (account.role || 'citizen').toLowerCase(),
          departmentId: account.departmentId || null,
          department: account.department || null
        },
        token
      });
    } catch (error) {
      next(error);
    }
  }
}
