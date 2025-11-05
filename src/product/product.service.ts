import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from './entities/product.entity';
import { Model } from 'mongoose';
import { User } from 'src/users/entities/user.entity';
import { Category } from 'src/category/entities/category.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) { }

  async create(createProductDto: CreateProductDto, userId: string) {
    const { name, price, description, categoryName } = createProductDto;

    const category = await this.categoryModel.findOne({ name: categoryName }).exec();
    if (!category) throw new NotFoundException('Category not found');

    const product = await this.productModel.create({
      name,
      price,
      description,
      category: category._id,
      user: userId,
    });

    await this.categoryModel.findByIdAndUpdate(category._id, {
      $push: { products: product._id },
    });

    await this.userModel.findByIdAndUpdate(userId, {
      $push: { products: product._id },
    });

    const populatedProduct = await product.populate(['category', 'user']);
    return {
      id: populatedProduct._id,
      name: populatedProduct.name,
      description: populatedProduct.description,
      price: populatedProduct.price,
      category: {
        id: category._id,
        name: category.name,
      },
      user: {
        id: (populatedProduct.user as any)._id,
        email: (populatedProduct.user as any).email,
        firstName: (populatedProduct.user as any).firstName,
        lastName: (populatedProduct.user as any).lastName,
        phone: (populatedProduct.user as any).phone,
        address: (populatedProduct.user as any).address
      },
    };
  }

  async findAll() {
    const products = await this.productModel
      .find()
      .populate('category', 'name _id')
      .populate('user', 'firstName lastName email phone address _id')
      .exec();

    return products.map((product) => ({
      id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: {
        id: (product.category as any)._id,
        name: (product.category as any).name,
      },
      user: {
        id: (product.user as any)._id,
        email: (product.user as any).email,
        firstName: (product.user as any).firstName,
        lastName: (product.user as any).lastName,
        phone: (product.user as any).phone,
        address: (product.user as any).address
      },
    }));
  }

  async findOne(id: string) {
    const product = await this.productModel
      .findById(id)
      .populate('category', 'name _id')
      .populate('user', 'firstName lastName email phone address _id')
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    return {
      id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: {
        id: (product.category as any)._id,
        name: (product.category as any).name,
      },
      user: {
        id: (product.user as any)._id,
        email: (product.user as any).email,
        firstName: (product.user as any).firstName,
        lastName: (product.user as any).lastName,
        phone: (product.user as any).phone,
        address: (product.user as any).address,
      },
    };
  }


  async remove(id: string) {
        const deletedProduct = await this.productModel.findByIdAndDelete(id);

    if (!deletedProduct) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    return {
      message: 'Product deleted successfully',
      id: deletedProduct._id,
      name: deletedProduct.name,
    };
  }
}
