import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from './entities/category.entity';
import { isValidObjectId, Model, Types } from 'mongoose';
import { Product, ProductDocument } from 'src/product/entities/product.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) { }

  async create(createCategoryDto: CreateCategoryDto) {
    const { name } = createCategoryDto;

    if (!createCategoryDto.name) {
      throw new BadRequestException({
        message: 'name category cannot be empty',
        details: createCategoryDto,
      });
    }

    const category = new this.categoryModel({
      name: name
    });

    const newCategory = await category.save();
    return { id: newCategory.id, name: newCategory.name };

  }

  async findAll() {
    const categories = await this.categoryModel.find().select('name').exec();

    return categories.map(category => ({
      id: category._id,
      name: category.name,
    }));
  }


  async findOne(id: string) {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('category Not Found');
    }
    return { id: category.id, name: category.name };
  }

  async remove(id: string) {

    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid ID format: "${id}"`);
    }
    const deletedCategory = await this.categoryModel.findByIdAndDelete(id);

    if (!deletedCategory) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    await this.productModel.deleteMany({
      category: new Types.ObjectId(id),
    });

    // user delete products[]
    
    return {
      message: 'Category deleted successfully',
      id: deletedCategory._id,
      name: deletedCategory.name,
    };
  }
}
