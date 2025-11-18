import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './entities/user.entity';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

    async create(userData: Partial<User>, saltRounds = 10): Promise<User> {
        const existing = await this.userModel.findOne({ email: userData.email }).exec();
        if (existing) throw new BadRequestException('Email already in use');

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
    async findByEmailWithPassword(email: string): Promise<User | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async updateUserById(id: string, updateData: any) {
        const user = await this.userModel.findById(id).select('-password').exec();
        if (!user) return null;

        if (updateData.firstName !== undefined) user.firstName = updateData.firstName;
        if (updateData.lastName !== undefined) user.lastName = updateData.lastName;
        if (updateData.phone !== undefined) user.phone = updateData.phone;
        if (updateData.address !== undefined) user.address = updateData.address;
        if (updateData.image !== undefined) {
            if (user.image) {
                const relativePath = user.image.startsWith('/') ? user.image.slice(1) : user.image;
                const oldImagePath = join(process.cwd(), relativePath);
                try {
                    await fs.unlink(oldImagePath);
                } catch (err) {
                    console.warn('Old image not found or cannot be deleted', err);
                }
            }
            user.image = updateData.image;
        }

        return await user.save();;
    }
}
