import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await this.usersService.comparePassword(password, user.password)) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user._id, role: user.role, userId: user._id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    const payload = { email: user.email, sub: user._id, role: user.role, userId: user._id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async sendOtp(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();
    
    // Send OTP via email
    await this.emailService.sendOtpEmail(email, otp, user.firstName);
    
    return { message: 'OTP sent to email' };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.otp || !user.otpExpires) throw new UnauthorizedException('Invalid OTP');
    if (user.otp !== otp) throw new UnauthorizedException('Invalid OTP');
    if (user.otpExpires < new Date()) throw new UnauthorizedException('OTP expired');
    
    // Clear OTP
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    
    // Issue JWT
    const payload = { email: user.email, sub: user._id, role: user.role, userId: user._id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async requestPasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    
    user.passwordResetOtp = otp;
    user.passwordResetOtpExpires = otpExpires;
    await user.save();
    
    // Send password reset OTP via email
    await this.emailService.sendPasswordResetEmail(email, otp, user.firstName);
    
    return { message: 'Password reset OTP sent to email' };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.passwordResetOtp || !user.passwordResetOtpExpires) throw new BadRequestException('Invalid or expired OTP');
    if (user.passwordResetOtp !== otp) throw new BadRequestException('Invalid OTP');
    if (user.passwordResetOtpExpires < new Date()) throw new BadRequestException('OTP expired');
    
    // Set new password
    await this.usersService.update((user as any)._id.toString(), { password: newPassword });
    
    // Clear OTP
    user.passwordResetOtp = undefined;
    user.passwordResetOtpExpires = undefined;
    await user.save();
    
    return { message: 'Password reset successful' };
  }
} 