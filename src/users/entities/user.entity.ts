import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Product } from 'src/product/entities/product.entity';

export type UserDocument = User & Document;


@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  phone?: string;

  @Prop()
  address?: string;

  @Prop()
  image?: string;

  @Prop()
  isTechnician: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }] })
  products: Product[];

  toObject: any;
}

export const UserSchema = SchemaFactory.createForClass(User);
