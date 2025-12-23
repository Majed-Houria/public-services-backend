import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User, UserDocument } from 'src/users/entities/user.entity';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from 'src/product/entities/product.entity';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { Category, CategoryDocument } from 'src/category/entities/category.entity';
import { join } from 'path';
import { promises as fs } from 'fs';
import { UpdatePasswordDto } from './dto/update_password.dto';


@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,

  ) { }

  async register(dto: RegisterDto, saltRounds = 10) {
    const user = await this.usersService.create(dto, saltRounds);
    const { password, ...result } = user.toObject ? user.toObject() : user;
    return { id: result._id, email: result.email, firstName: result.firstName, lastName: result.lastName, phone: result.phone, address: result.address, image: result.image, isTechnician: result.isTechnician };
  }

  async validateUser(email: string, plainPassword: string) {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) return null;
    const isMatch = await bcrypt.compare(plainPassword, user.password);
    if (!isMatch) return null;
    const { password, ...result } = user.toObject ? user.toObject() : user;
    return { id: result._id, email: result.email, firstName: result.firstName, lastName: result.lastName, phone: result.phone, address: result.address, image: result.image, isTechnician: result.isTechnician };
  }

  async login(user: any) {
    const payload = { id: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      userType : user.isTechnician == true ? "technician" : "customer",
    };
  }


  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...result } = user.toObject ? user.toObject() : user;
    return { id: result._id, email: result.email, firstName: result.firstName, lastName: result.lastName, phone: result.phone, address: result.address, image: result.image, isTechnician: result.isTechnician };
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
      image: result.image,
      isTechnician: result.isTechnician
    };
  }

  async restPassword(userId: string, updatePasswordDto: UpdatePasswordDto, saltRounds = 10) {
    const { oldPassword, newPassword } = updatePasswordDto;

    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Old password is incorrect');
    }

    const hashed = await bcrypt.hash(newPassword!, saltRounds);
    user.password = hashed;
    await user.save();

    return {
      message: 'Password changed successfully',
    };
  }

  async deleteAccount(userId: string, deleteAccountDto: DeleteAccountDto) {
    const { password } = deleteAccountDto;

    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new BadRequestException('password is incorrect');
    }
    const deletedUser = await this.userModel.findByIdAndDelete(userId);
    if (!deletedUser) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const deletedProducts = await this.productModel.find({ user: userId }).select('_id image').exec();
    deletedProducts.map(
      p => p.image
    );

    for (const product of deletedProducts) {
      if (product.image) {
        const relativePath = product.image.startsWith('/')
          ? product.image.slice(1)
          : product.image;
        const oldImagePath = join(process.cwd(), relativePath);
        try {
          await fs.unlink(oldImagePath);
        } catch (err) {
          console.warn('Old product image not found or cannot be deleted', err);
        }
      }
    }

    const deletedProductIds = deletedProducts.map(p => p._id);

    await this.categoryModel.updateMany(
      { products: { $in: deletedProductIds } },
      { $pull: { products: { $in: deletedProductIds } } }
    );


    await this.productModel.deleteMany({
      user: new Types.ObjectId(userId),
    });

    if (user.image) {
      const relativePath = user.image.startsWith('/') ? user.image.slice(1) : user.image;
      const oldImagePath = join(process.cwd(), relativePath);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.warn('Old image not found or cannot be deleted', err);
      }
    }

    await this.productModel.updateMany(
      { usersFavorite: userId },
      { $pull: { usersFavorite: userId } }
    );

    return {
      message: 'Account successfully deleted',
    };
  }
}
