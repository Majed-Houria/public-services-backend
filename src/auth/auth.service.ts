import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService) { }

  async register(dto: any, saltRounds = 10) {
    const user = await this.usersService.create(dto, saltRounds);
    const { password, ...result } = user.toObject ? user.toObject() : user;
    return { id: result._id , email: result.email, firstName: result.firstName, lastName: result.lastName , phone: result.phone , address: result.address};
  }

    async validateUser(email: string, plainPassword: string) {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) return null;
    const isMatch = await bcrypt.compare(plainPassword, user.password);
    if (!isMatch) return null;
    const { password, ...result } = user.toObject ? user.toObject() : user;
    return { id: result._id , email: result.email, firstName: result.firstName, lastName: result.lastName , phone: result.phone , address: result.address};
  }

  async login(user: any) {
    const payload = { id: user._id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

}
