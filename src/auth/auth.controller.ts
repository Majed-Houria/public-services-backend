import { Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, ValidationPipe, HttpCode, HttpStatus, UnauthorizedException, UseGuards, Req, BadRequestException, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UpdatePasswordDto } from './dto/update_password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true }))
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
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueName = `${Date.now()}${extname(file.originalname)}`;
        callback(null, uniqueName);
      },
    }),
  }))
  async editProfile(
    @Req() req: any,
    @Body() updateData: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      updateData.image = `/uploads/${file.filename}`;
    }
    return await this.authService.editProfile(req.user._id, updateData);
  }

  @Patch('rest-password')
  @UseGuards(JwtAuthGuard)
  async restPassword(@Req() req: any, @Body() updatePasswordDto: UpdatePasswordDto) {
    return await this.authService.restPassword(req.user._id, updatePasswordDto);
  }

  @Delete('delete-account')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@Req() req: any, @Body() deleteAccountDto: DeleteAccountDto) {
    return await this.authService.deleteAccount(req.user._id, deleteAccountDto);
  }
}
