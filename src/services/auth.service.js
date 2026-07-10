import { prisma } from '../config/database.js';
import { BadRequestError, UnauthorizedError } from '../utils/apiError.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'civiqai_secret_key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'civiqai_refresh_secret_key';

export class AuthService {
  static async registerCitizen(data) {
    const existing = await prisma.user.findUnique({
      where: { username: data.username },
    });
    if (existing) {
      throw new BadRequestError('Username is already taken');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        phone: data.phone || null,
        passwordHash,
        role: 'CITIZEN',
      },
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  static async login(username, password, loginType) {
    let account = null;
    let isUser = true;

    // Determine target model based on loginType (USER, OFFICER, SYSTEM)
    if (loginType === 'USER' || loginType === 'SYSTEM') {
      account = await prisma.user.findUnique({ where: { username } });
    } else if (loginType === 'OFFICER') {
      account = await prisma.officer.findUnique({
        where: { username },
        include: { department: true },
      });
      isUser = false;
    } else {
      throw new BadRequestError('Invalid login type specified');
    }

    if (!account) {
      throw new UnauthorizedError('Invalid username or password');
    }

    if (account.status === 'SUSPENDED') {
      throw new UnauthorizedError('Your account has been suspended');
    }

    const isPasswordValid = await bcrypt.compare(password, account.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid username or password');
    }

    // Generate JWT access and refresh tokens
    const payload = {
      id: account.id,
      username: account.username,
      role: account.role,
      type: loginType,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: account.id, type: loginType }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    // Store the refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: isUser ? account.id : null,
        officerId: !isUser ? account.id : null,
        expiresAt,
      },
    });

    // Remove passwordHash from return object
    const { passwordHash: _, ...profile } = account;

    return {
      profile,
      accessToken,
      refreshToken,
    };
  }

  static async logout(refreshToken) {
    if (!refreshToken) {
      throw new BadRequestError('Refresh token is required');
    }

    const tokenExists = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (tokenExists) {
      await prisma.refreshToken.delete({
        where: { token: refreshToken },
      });
    }

    return true;
  }
}
