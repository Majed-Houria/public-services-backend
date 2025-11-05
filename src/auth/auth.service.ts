import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService) { }

  async register(dto: RegisterDto, saltRounds = 10) {
    const user = await this.usersService.create(dto, saltRounds);
    const { password, ...result } = user.toObject ? user.toObject() : user;
    return { id: result._id, email: result.email, firstName: result.firstName, lastName: result.lastName, phone: result.phone, address: result.address };
  }

  async validateUser(email: string, plainPassword: string) {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) return null;
    const isMatch = await bcrypt.compare(plainPassword, user.password);
    if (!isMatch) return null;
    const { password, ...result } = user.toObject ? user.toObject() : user;
    return { id: result._id, email: result.email, firstName: result.firstName, lastName: result.lastName, phone: result.phone, address: result.address };
  }

  async login(user: any) {
    const payload = { id: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }


  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...result } = user.toObject ? user.toObject() : user;
    return { id: result._id, email: result.email, firstName: result.firstName, lastName: result.lastName, phone: result.phone, address: result.address };
  }

    async editProfile(userId: string, updateData: UpdateProfileDto) {
    const updatedUser = await this.usersService.updateUserById(userId, updateData);
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    const { password, ...result } = updatedUser.toObject ? updatedUser.toObject() : updatedUser;

    return {
      id: result._id,
      email: result.email,
      firstName: result.firstName,
      lastName: result.lastName,
      phone: result.phone,
      address: result.address,
    };
  }
}
