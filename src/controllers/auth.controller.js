import { AuthService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { BadRequestError } from '../utils/apiError.js';

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
}
