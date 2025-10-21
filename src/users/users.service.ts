import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './entities/user.entity';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

    async create(userData: Partial<User>, saltRounds = 10): Promise<User> {
        const existing = await this.userModel.findOne({ email: userData.email }).exec();
        if (existing) throw new ConflictException({ message: 'Email already in use' });

        const hashed = await bcrypt.hash(userData.password!, saltRounds);
        const created = new this.userModel({ ...userData, password: hashed });
        return created.save();
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async findById(id: string): Promise<User | null> {
        return this.userModel.findById(id).select('-password').exec();
    }

    // For auth: fetch including password
    async findByEmailWithPassword(email: string): Promise<User | null> {
        return this.userModel.findOne({ email }).exec();
    }
}
