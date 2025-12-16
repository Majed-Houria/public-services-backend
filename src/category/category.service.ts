import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from './entities/category.entity';
import { isValidObjectId, Model, Types } from 'mongoose';
import { Product, ProductDocument } from 'src/product/entities/product.entity';
import { join } from 'path';
import { promises as fs } from 'fs';
import { User, UserDocument } from 'src/users/entities/user.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,

  ) { }

  async create(createCategoryDto: CreateCategoryDto) {
    const { name, image } = createCategoryDto;

    if (!createCategoryDto.name) {
      throw new BadRequestException({
        message: 'name category cannot be empty',
      });
    }
    if (createCategoryDto.image == undefined) {
      throw new BadRequestException({
        message: 'image category cannot be empty',
      });
    }


    const category = new this.categoryModel({
      name: name,
      image: image
    });

    const newCategory = await category.save();
    return { id: newCategory.id, name: newCategory.name, image: newCategory.image };

  }

  async findAll() {
    const categories = await this.categoryModel.find().exec();

    return categories.map(category => ({
      id: category._id,
      name: category.name,
      image: category.image,
    }));
  }


  async findOne(id: string) {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('category Not Found');
    }
    return { id: category.id, name: category.name, image: category.image };
  }

  async remove(id: string) {

    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid ID format: "${id}"`);
    }
    const deletedCategory = await this.categoryModel.findByIdAndDelete(id);

    if (!deletedCategory) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    const deletedProducts = await this.productModel.find({ category: new Types.ObjectId(id) }).select('_id').exec();
    const deletedProductIds = deletedProducts.map(p => {
      console.log(p);
      return p._id;
    });


    await this.userModel.updateMany(
      { products: { $in: deletedProductIds } },
      { $pull: { products: { $in: deletedProductIds } } }
    );

    await this.productModel.deleteMany({
      category: new Types.ObjectId(id),
    });


    if (deletedCategory.image) {
      const relativePath = deletedCategory.image.startsWith('/') ? deletedCategory.image.slice(1) : deletedCategory.image;
      const oldImagePath = join(process.cwd(), relativePath);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.warn('Old image not found or cannot be deleted', err);
      }
    }
    return {
      message: 'Category deleted successfully',
      id: deletedCategory._id,
      name: deletedCategory.name,
    };
  }
}
