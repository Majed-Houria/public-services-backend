import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/users/entities/user.entity';

export type OrderDocument = Order & Document;


@Schema({ timestamps: true })
export class Order {

  @Prop({ required: true })
  state: string;

  @Prop({ type: Types.ObjectId, ref: 'Product' , required: true})
  product: Product;

  // اللي هي بعت الطلب
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: User;

  toObject: any;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
