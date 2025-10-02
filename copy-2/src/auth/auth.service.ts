import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthResponse } from './interfaces/auth-response.interface';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    
    if (user && await this.usersService.validatePassword(user, password)) {
      return user;
    }
    
    return null;
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    await this.usersService.updateLastLogin(user.id);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        plan: user.plan,
        avatar: user.avatar,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create user
    const user = await this.usersService.create(registerDto);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    // TODO: Send verification email

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        plan: user.plan,
        avatar: user.avatar,
      },
    };
  }

  async googleLogin(profile: any): Promise<AuthResponse> {
    let user = await this.usersService.findByEmail(profile.email);

    if (!user) {
      // Create new user from Google profile
      const username = this.generateUsername(profile.email);
      user = await this.usersService.create({
        email: profile.email,
        username,
        firstName: profile.firstName,
        lastName: profile.lastName,
        password: crypto.randomBytes(32).toString('hex'), // Random password
      });

      // Mark email as verified for OAuth accounts
      await this.usersService.setEmailVerified(user.id);
    }

    await this.usersService.updateLastLogin(user.id);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        plan: user.plan,
        avatar: user.avatar,
      },
    };
  }

  async microsoftLogin(profile: any): Promise<AuthResponse> {
    let user = await this.usersService.findByEmail(profile.email);

    if (!user) {
      // Create new user from Microsoft profile
      const username = this.generateUsername(profile.email);
      user = await this.usersService.create({
        email: profile.email,
        username,
        firstName: profile.firstName,
        lastName: profile.lastName,
        password: crypto.randomBytes(32).toString('hex'), // Random password
      });

      // Mark email as verified for OAuth accounts
      await this.usersService.setEmailVerified(user.id);
    }

    await this.usersService.updateLastLogin(user.id);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        plan: user.plan,
        avatar: user.avatar,
      },
    };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await this.usersService.setPasswordResetToken(email, resetToken, resetExpires);

    // TODO: Send password reset email
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.usersService.resetPassword(token, newPassword);
  }

  private generateUsername(email: string): string {
    const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomSuffix = Math.floor(Math.random() * 10000);
    return `${baseUsername}${randomSuffix}`;
  }
}
