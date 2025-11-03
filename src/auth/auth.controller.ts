import { Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, ValidationPipe, HttpCode, HttpStatus, UnauthorizedException, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true}))
  async register(@Body() dto: RegisterDto) {
    return await this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(@Body() dto: LoginDto) {
    const validated = await this.authService.validateUser(dto.email, dto.password);
    if (!validated) {
      throw new BadRequestException('password is not corect');
    }
    return this.authService.login(validated);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user._id);
  }

  @Patch('edit-profile')
  @UseGuards(JwtAuthGuard)
  async editProfile(@Req() req: any, @Body() updateData: UpdateProfileDto) {
    return await this.authService.editProfile(req.user._id, updateData);
  }
}
