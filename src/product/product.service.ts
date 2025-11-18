import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from './entities/product.entity';
import { Model, Types } from 'mongoose';
import { User } from 'src/users/entities/user.entity';
import { Category } from 'src/category/entities/category.entity';
import { ChangeFavoriteProductDto } from './dto/change_favorite_product.dto';
import { RatingDto } from './dto/rating.dto';
import { join } from 'path';
import { promises as fs } from 'fs';


@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) { }

  async create(createProductDto: CreateProductDto, userId: string) {
    const { name, price, description, categoryName, image } = createProductDto;

    const category = await this.categoryModel.findOne({ name: categoryName }).exec();
    if (!category) throw new NotFoundException('Category not found');

    const product = await this.productModel.create({
      name,
      price,
      description,
      category: category._id,
      user: userId,
      image,
      rate: 2.5,
      countUserRate: 0,
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
      image: populatedProduct.image,
      rate: populatedProduct.rate,
      countUserRate: populatedProduct.countUserRate,
      category: {
        id: category._id,
        name: category.name,
        image: (populatedProduct.category as any).image,
      },
      user: {
        id: (populatedProduct.user as any)._id,
        email: (populatedProduct.user as any).email,
        firstName: (populatedProduct.user as any).firstName,
        lastName: (populatedProduct.user as any).lastName,
        phone: (populatedProduct.user as any).phone,
        address: (populatedProduct.user as any).address,
        isTechnician: (populatedProduct.user as any).isTechnician
      },
    };
  }

  async findAll(
    userId: string,
    ordering?: string,
    category?: string,
    search?: string,
  ) {

    const filter: any = {};

    if (category) {
      const categoryObj = await this.categoryModel.findOne({ name: category }).exec();
      if (!categoryObj) throw new BadRequestException(`category not found`);
      filter.category = new Types.ObjectId(categoryObj._id);
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { name: { $regex: regex } },
        { description: { $regex: regex } },
      ];
    }

    let productsQuery: any;

    switch (ordering) {
      case 'favorite':
        productsQuery = this.productModel.aggregate([
          { $match: filter },

          {
            $addFields: {
              favoritesCount: { $size: { $ifNull: ['$usersFavorite', []] } },
            },
          },
          { $sort: { favoritesCount: -1 } },
          { $limit: 8 },

          {
            $lookup: {
              from: 'categories',
              localField: 'category',
              foreignField: '_id',
              as: 'category',
            },
          },
          { $unwind: "$category" },

          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'user',
            },
          },
          { $unwind: "$user" },
        ]);
        break;

      case 'newest':
        productsQuery = this.productModel
          .find(filter)
          .populate('category', 'name _id image')
          .populate('user', 'firstName lastName email phone address _id isTechnician')
          .sort({ createdAt: -1 })
          .limit(8);
        break;

      case 'topRated':
        productsQuery = this.productModel
          .find(filter)
          .populate('category', 'name _id image')
          .populate('user', 'firstName lastName email phone address _id isTechnician')
          .sort({ rate: -1 })
          .limit(8);
        break;

      default:
        productsQuery = this.productModel
          .find(filter)
          .populate('category', 'name _id image')
          .populate('user', 'firstName lastName email phone address _id isTechnician')
          .sort({ createdAt: -1 });
        break;
    }

    const products = await productsQuery.exec?.() ?? productsQuery;

    return products.map((product) => {
      const isFavorite = product.usersFavorite?.some(
        (favUserId) => favUserId.toString() == userId,
      );

      return {
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        rate: product.rate,
        countUserRate: product.countUserRate,
        is_fav: isFavorite,

        category: {
          id: (product.category as any)._id,
          name: (product.category as any).name,
          image: (product.category as any).image,
        },

        user: {
          id: (product.user as any)._id,
          email: (product.user as any).email,
          firstName: (product.user as any).firstName,
          lastName: (product.user as any).lastName,
          phone: (product.user as any).phone,
          address: (product.user as any).address,
          isTechnician: (product.user as any).isTechnician,
        },
      };
    });
  }

  async findOne(id: string, userId: string) {
    const product = await this.productModel
      .findById(id)
      .populate('category', 'name _id image')
      .populate('user', 'firstName lastName email phone address _id isTechnician')
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    const isFavorite = product.usersFavorite?.some(
      (favUserId) => favUserId.toString() == userId,
    );
    return {
      id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      rate: product.rate,
      countUserRate: product.countUserRate,
      is_fav: isFavorite,
      category: {
        id: (product.category as any)._id,
        name: (product.category as any).name,
        image: (product.category as any).image,
      },
      user: {
        id: (product.user as any)._id,
        email: (product.user as any).email,
        firstName: (product.user as any).firstName,
        lastName: (product.user as any).lastName,
        phone: (product.user as any).phone,
        address: (product.user as any).address,
        isTechnician: (product.user as any).isTechnician
      },
    };
  }


  async remove(id: string, userId: string) {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    if ((product.user as any)._id.toString() != userId) {
      throw new ForbiddenException('You are not allowed to delete this product');
    }
    const deletedProduct = await this.productModel.findByIdAndDelete(id);

    if (!deletedProduct) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    await this.categoryModel.findByIdAndUpdate((product.category as any)._id.toString(), {
      $pull: { products: product._id },
    });

    await this.userModel.findByIdAndUpdate((product.user as any)._id.toString(), {
      $pull: { products: product._id },
    });

    if (product.image) {
      const relativePath = product.image.startsWith('/') ? product.image.slice(1) : product.image;
      const oldImagePath = join(process.cwd(), relativePath);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.warn('Old image not found or cannot be deleted', err);
      }
    }

    return {
      message: 'Product deleted successfully',
      id: deletedProduct._id,
      name: deletedProduct.name,
    };
  }

  async toggle(changeFavoriteProductDto: ChangeFavoriteProductDto, userId: string) {
    const { id } = changeFavoriteProductDto;
    const user = await this.userModel.findById(userId).exec();
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new BadRequestException(`Product with ID "${id}" not found`);
    }
    if (!user) {
      throw new BadRequestException(`user with ID "${id}" not found`);
    }

    const isFavorite = product.usersFavorite.some(
      (favUserId) => favUserId.toString() == userId,
    );

    if (isFavorite) {
      await this.productModel.findByIdAndUpdate(id, {
        $pull: { usersFavorite: userId },
      });
    } else {
      await this.productModel.findByIdAndUpdate(id, {
        $push: { usersFavorite: userId },
      });
    }

    return {
      message: isFavorite
        ? 'Product removed from favorites'
        : 'Product added to favorites',
      productId: id,
    };
  }

  async favorite(userId: string) {
    const products = await this.productModel
      .find({ usersFavorite: userId })
      .populate('category', 'name _id image')
      .populate('user', 'firstName lastName email phone address _id isTechnician')
      .exec();

    return products.map((product) => ({
      id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      rate: product.rate,
      countUserRate: product.countUserRate,
      is_fav: true,
      category: {
        id: (product.category as any)._id,
        name: (product.category as any).name,
        image: (product.category as any).image,
      },
      user: {
        id: (product.user as any)._id,
        email: (product.user as any).email,
        firstName: (product.user as any).firstName,
        lastName: (product.user as any).lastName,
        phone: (product.user as any).phone,
        address: (product.user as any).address,
        isTechnician: (product.user as any).isTechnician
      },
    }));
  }

  async service(userId: string) {
    const products = await this.productModel
      .find({ user: userId })
      .populate('category', 'name _id image')
      .populate('user', 'firstName lastName email phone address _id isTechnician')
      .exec();

    return products.map((product) => {
      const isFavorite = product.usersFavorite?.some(
        (favUserId) => favUserId.toString() == userId,
      );

      return {
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        rate: product.rate,
        countUserRate: product.countUserRate,
        is_fav: isFavorite,
        category: {
          id: (product.category as any)._id,
          name: (product.category as any).name,
          image: (product.category as any).image,
        },
        user: {
          id: (product.user as any)._id,
          email: (product.user as any).email,
          firstName: (product.user as any).firstName,
          lastName: (product.user as any).lastName,
          phone: (product.user as any).phone,
          address: (product.user as any).address,
          isTechnician: (product.user as any).isTechnician
        },
      };
    });
  }

  async rating(userId: string, rateingDto: RatingDto) {
    const { id, rate } = rateingDto;
    const product = await this.productModel
      .findById(id)
      .populate('category', 'name _id image')
      .populate('user', 'firstName lastName email phone address _id isTechnician')
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    product.rate = ((product.rate * product.countUserRate) + rateingDto.rate) / (product.countUserRate + 1);
    product.countUserRate = product.countUserRate + 1;

    await product.save();
    return {
      message: 'Product add rating successfully'
    };
  }

  async homeCards(userId: string, ordering: string) {
    let productsQuery;

    switch (ordering) {
      case 'favorite':
        productsQuery = await this.productModel.aggregate([
          {
            $addFields: {
              favoritesCount: { $size: { $ifNull: ['$usersFavorite', []] } },
            },
          },
          { $sort: { favoritesCount: -1 } },
          { $limit: 8 },
          {
            $project: {
              _id: 1,
              name: 1,
              image: 1,
              favoritesCount: 1,
              rate: 1,
              countUserRate: 1,
            },
          },
        ]);

        break;

      case 'newest':
        productsQuery = this.productModel
          .find()
          .populate('category', 'name _id image')
          .populate('user', 'firstName lastName email phone address _id isTechnician')
          .sort({ createdAt: -1 })
          .limit(8);
        break;

      case 'topRated':
        productsQuery = this.productModel
          .find()
          .populate('category', 'name _id image')
          .populate('user', 'firstName lastName email phone address _id isTechnician')
          .sort({ rate: -1 })
          .limit(8);
        break;

      default:
        productsQuery = this.productModel
          .find()
          .populate('category', 'name _id image')
          .populate('user', 'firstName lastName email phone address _id isTechnician')
          .sort({ createdAt: -1 })
          .limit(8);
        break;
    }

    const products = await productsQuery.exec();

    return products.map((product) => {
      const isFavorite = product.usersFavorite?.some(
        (favUserId) => favUserId.toString() == userId,
      );

      return {
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        rate: product.rate,
        countUserRate: product.countUserRate,
        is_fav: isFavorite,
        category: {
          id: (product.category as any)._id,
          name: (product.category as any).name,
          image: (product.category as any).image,
        },
        user: {
          id: (product.user as any)._id,
          email: (product.user as any).email,
          firstName: (product.user as any).firstName,
          lastName: (product.user as any).lastName,
          phone: (product.user as any).phone,
          address: (product.user as any).address,
          isTechnician: (product.user as any).isTechnician
        },
      };
    });
  }
}
