import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { RegisterDto, LoginDto } from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private static readonly SALT_ROUNDS = 12;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) { }

  async register(
    dto: RegisterDto,
  ): Promise<{ accessToken: string; user: { id: number; email: string; fullName: string } }> {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(
      dto.password,
      AuthService.SALT_ROUNDS,
    );

    const user = this.userRepository.create({
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
    });

    const savedUser = await this.userRepository.save(user);
    const accessToken = this.generateToken(savedUser);

    return {
      accessToken,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        fullName: savedUser.fullName,
      },
    };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; user: { id: number; email: string; fullName: string } }> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = this.generateToken(user);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    };
  }

  async getProfile(
    userId: number,
  ): Promise<{ id: number; email: string; fullName: string; role: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });
    // Always return success to avoid email enumeration
    if (!user || !user.isActive) {
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    const token = crypto.randomBytes(48).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    user.resetToken = token;
    user.resetTokenExpiry = expiry;
    await this.userRepository.save(user);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    try {
      await this.mailService.sendPasswordReset(user.email, resetLink);
    } catch (err) {
      // Roll back token so user can retry
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await this.userRepository.save(user);
      console.error('[ForgotPassword] Email send failed:', err);
      throw new Error('Failed to send reset email. Please check SMTP configuration.');
    }

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { resetToken: token } });

    if (
      !user ||
      !user.resetTokenExpiry ||
      user.resetTokenExpiry < new Date()
    ) {
      throw new BadRequestException('Reset token is invalid or has expired.');
    }

    user.passwordHash = await bcrypt.hash(newPassword, AuthService.SALT_ROUNDS);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await this.userRepository.save(user);

    return { message: 'Password has been reset successfully.' };
  }

  async changePassword(
    userId: number,
    dto: { currentPassword: string; newPassword: string },
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Current password is incorrect');

    user.passwordHash = await bcrypt.hash(dto.newPassword, AuthService.SALT_ROUNDS);
    await this.userRepository.save(user);
    return { message: 'Password changed successfully' };
  }

  private generateToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }
}
