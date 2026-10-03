import {
  Body,
  Controller,
  Get,
  Post,
  UnauthorizedException,
  UseGuards,
  Request,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Post('register')
  async register(
    @Body() dto: { email: string; name: string; password: string },
  ) {
    return this.authService.register(dto.email, dto.name, dto.password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: { email: string; password: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException();
    }
    const { access_token } = await this.authService.login(user);

    const isProd = process.env.NODE_ENV === 'production';

    response.cookie('token', access_token, {
      httpOnly: true,
      secure: isProd,
      // CURRENT SETUP (Vercel + Render): Must use 'none' for cross-site requests.
      // TODO: When you get a custom domain (e.g., app.yourdomain.com + api.yourdomain.com),
      // change this to 'lax' or 'strict'.
      sameSite: isProd ? 'none' : 'lax',

      // TODO: When you get a custom domain, uncomment the line below,
      // and set COOKIE_DOMAIN=".yourdomain.com" in your Render environment variables.
      // domain: process.env.COOKIE_DOMAIN,

      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { message: 'Login successful' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) response: Response) {
    const isProd = process.env.NODE_ENV === 'production';

    response.clearCookie('token', {
      httpOnly: true,
      secure: isProd,
      // Keep this matching the login settings exactly
      sameSite: isProd ? 'none' : 'lax',
      // domain: process.env.COOKIE_DOMAIN, // Uncomment when using custom domain
      path: '/',
    });
    return { message: 'Logout successful' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@Request() req) {
    return req.user;
  }
}
