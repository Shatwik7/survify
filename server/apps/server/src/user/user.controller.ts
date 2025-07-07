import { Controller, Post, Body, UseGuards, Request, Get, Delete, HttpCode, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '@app/auth';
import { LocalAuthGuard } from '@app/auth';
import { JwtAuthGuard } from '@app/auth';
import { User } from '@app/database';
import { SignUpDto } from '@app/auth';

@Controller()
export class UserController {
  constructor(private authService: AuthService) { }

  @Post('signup')
  async register(@Body() body: SignUpDto): Promise<Partial<User>> {
    return this.authService.register(body);
  }

  @UseGuards(LocalAuthGuard)
  @Post('signin')
  login(@Request() req: { user: User }): ({ access_token: string; }) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: { user: User }): User {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  @HttpCode(201)
  async deleteProfile(@Request() req: { user: User }): Promise<{ success: boolean }> {
    const deleted = await this.authService.delete(req.user.id);
    if (!deleted) {
      throw new UnauthorizedException('User not found or could not be deleted');
    }
    return { success: deleted === true };
  }
}