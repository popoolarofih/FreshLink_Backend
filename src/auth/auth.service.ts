import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ──────────────────────────────────────────────
  // Registration
  // ──────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use.');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const emailVerifyToken = uuidv4();

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        phone: dto.phone,
        emailVerifyToken,
        // Auto-create the appropriate profile
        ...(dto.role === Role.PROVIDER
          ? { providerProfile: { create: {} as any } }
          : { buyerProfile: { create: {} } }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        emailVerifyToken: true,
        createdAt: true,
      },
    });

    // TODO: send verification email via NotificationService
    // For now, return the token so the dev can call /auth/verify-email directly
    console.log(
      `[EMAIL STUB] Verify email token for ${user.email}: ${emailVerifyToken}`,
    );

    return {
      user: { ...user, emailVerifyToken: undefined },
      _devOnly_emailVerifyToken: user.emailVerifyToken, // remove in production
    };
  }

  // ──────────────────────────────────────────────
  // Email verification
  // ──────────────────────────────────────────────

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { emailVerifyToken: token },
    });
    if (!user) throw new BadRequestException('Invalid or expired token.');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerifyToken: null },
    });

    return { message: 'Email verified successfully.' };
  }

  // ──────────────────────────────────────────────
  // Login
  // ──────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated.');
    }

    return this.issueTokenPair(user.id, user.email, user.role);
  }

  // ──────────────────────────────────────────────
  // Refresh token rotation
  // ──────────────────────────────────────────────

  async refresh(rawRefreshToken: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(rawRefreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const tokenHash = await bcrypt.hash(rawRefreshToken, 10);
    // Find by user id and check if any valid token exists
    const stored = await this.prisma.refreshToken.findFirst({
      where: { userId: payload.sub, revokedAt: null },
    });

    if (!stored || new Date() > stored.expiresAt) {
      throw new UnauthorizedException('Refresh token not found or expired.');
    }

    // Rotate: revoke old, issue new
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true },
    });
    if (!user) throw new UnauthorizedException();

    return this.issueTokenPair(user.id, user.email, user.role);
  }

  // ──────────────────────────────────────────────
  // Logout
  // ──────────────────────────────────────────────

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Logged out successfully.' };
  }

  // ──────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────

  private async issueTokenPair(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRY', '15m') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRY', '7d') as any,
    });

    // Store hashed refresh token
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    const expiryStr = this.config.get<string>('JWT_REFRESH_EXPIRY', '7d');
    const days = parseInt(expiryStr, 10) || 7;
    expiresAt.setDate(expiresAt.getDate() + days);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return { accessToken, refreshToken };
  }
}
