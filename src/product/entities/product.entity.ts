import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Category } from 'src/category/entities/category.entity';
import { User } from 'src/users/entities/user.entity';

export type ProductDocument = Product & Document;


@Schema({ timestamps: true })
export class Product {
    @Prop({ required: true })
    name: string;

    @Prop()
    description: string;

    @Prop({ required: true })
    price: number;

    @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
    category: Category;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: User;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
