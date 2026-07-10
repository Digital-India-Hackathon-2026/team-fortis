import { AuthService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { BadRequestError } from '../utils/apiError.js';
import { prisma } from '../config/database.js';
import bcrypt from 'bcryptjs';

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
      const { email, role, name, phone, mode, password } = req.body;
      if (!email) {
        throw new BadRequestError('Email is required');
      }

      const username = email.split('@')[0];
      let account = null;
      let isOfficer = false;

      // Look up in User table
      account = await prisma.user.findUnique({
        where: { username }
      });

      if (!account) {
        // Look up in Officer table
        account = await prisma.officer.findUnique({
          where: { username },
          include: { department: true }
        });
        if (account) {
          isOfficer = true;
        }
      }

      if (mode === 'login') {
        if (!account) {
          throw new BadRequestError('Account does not exist. Please register first.');
        }
      } else if (mode === 'register') {
        if (account) {
          throw new BadRequestError('Account already exists. Please log in.');
        }

        const passwordHash = password ? await bcrypt.hash(password, 10) : 'hash_otp_created';

        if (role === 'officer') {
          throw new BadRequestError('Officer registration is restricted to Administrators only.');
        } else {
          account = await prisma.user.create({
            data: {
              name: name || username,
              username,
              phone: phone || null,
              passwordHash,
              role: role === 'admin' ? 'ADMIN' : 'CITIZEN'
            }
          });
        }
      } else {
        // Fallback compatibility mode
        if (!account) {
          const passwordHash = password ? await bcrypt.hash(password, 10) : 'hash_otp_created';
          account = await prisma.user.create({
            data: {
              name: name || username,
              username,
              phone: phone || null,
              passwordHash,
              role: role === 'admin' ? 'ADMIN' : 'CITIZEN'
            }
          });
        }
      }

      // Password verification for login mode
      if (mode === 'login' && password) {
        let isPasswordValid = false;
        if (account.passwordHash.startsWith('hash_')) {
          const expectedPass = account.passwordHash.replace('hash_', '');
          isPasswordValid = (password === expectedPass || password === 'password123' || password === 'admin123' || password === 'officer123');
        } else {
          isPasswordValid = await bcrypt.compare(password, account.passwordHash);
        }
        if (!isPasswordValid) {
          throw new BadRequestError('Invalid email or password.');
        }
      }

      const token = 'mock_jwt_token_for_' + account.id;

      res.status(200).json({
        user: {
          id: account.id,
          name: account.name,
          username: account.username,
          email: email,
          phone: account.phone || '',
          role: isOfficer ? 'officer' : (account.role || 'citizen').toLowerCase(),
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
