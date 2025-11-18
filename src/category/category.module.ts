import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from './entities/category.entity';
import { Product, ProductSchema } from 'src/product/entities/product.entity';
import { User, UserSchema } from 'src/users/entities/user.entity';

@Module({
  imports:[
      MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }]),
      MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
      MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
