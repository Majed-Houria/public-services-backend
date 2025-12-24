import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    //@InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
  ) { }
  async create(createOrderDto: CreateOrderDto, userId: string) {
    const { id } = createOrderDto;
    const state = 'P'; // P : pending , A accept , R reject

    const order = await this.orderModel.create({
      state: state,
      product: id,
      user: userId
    });
    const populatedorder = await this.orderModel
      .findById(order._id)
      .populate({
        path: 'product',
        populate: ['category', 'user'],
      })
      .populate('user');
    if (!populatedorder) {
      throw new NotFoundException(`order with ID "${id}" not found`);
    }
    if (!populatedorder.product) {
      throw new NotFoundException('Product not found');
    }
    if (!populatedorder.product.category) {
      throw new NotFoundException(`"${populatedorder.state}"`);
    }
    if (!(populatedorder.product as any).user) {
      throw new NotFoundException('Product user not found');
    }
    return {
      id: populatedorder._id,
      state: populatedorder.state,
      product: {
        id: (populatedorder.product as any)._id,
        name: (populatedorder.product as any).name,
        description: (populatedorder.product as any).description,
        price: (populatedorder.product as any).price,
        image: (populatedorder.product as any).image,
        rate: (populatedorder.product as any).rate,
        countUserRate: (populatedorder.product as any).countUserRate,
        category: {
          id: (populatedorder.product as any).category._id,
          name: (populatedorder.product as any).category.name,
          image: (populatedorder.product as any).category.image,
        },
        user: {
          id: ((populatedorder.product as any).user as any)._id,
          email: ((populatedorder.product as any).user as any).email,
          firstName: ((populatedorder.product as any).user as any).firstName,
          lastName: ((populatedorder.product as any).user as any).lastName,
          phone: ((populatedorder.product as any).user as any).phone,
          address: ((populatedorder.product as any).user as any).address,
          isTechnician: ((populatedorder.product as any).user as any).isTechnician
        }
      },
      sender: {
        id: ((populatedorder.product as any).user as any)._id,
        email: ((populatedorder.product as any).user as any).email,
        firstName: ((populatedorder.product as any).user as any).firstName,
        lastName: ((populatedorder.product as any).user as any).lastName,
        phone: ((populatedorder.product as any).user as any).phone,
        address: ((populatedorder.product as any).user as any).address,
        isTechnician: ((populatedorder.product as any).user as any).isTechnician
      },
    }
  }

  async findAllSender(userId: string) {
    const orders = await this.orderModel
      .find({ user: userId })
      .populate({
        path: 'product',
        populate: ['category', 'user'],
      })
      .populate('user');

    const filteredOrders = orders.filter(order => order.product);

    if (!filteredOrders.length) {
      return [];
    }

    return filteredOrders.map(order => {
      const product: any = order.product;
      const productUser: any = product?.user;
      const senderUser: any = order.user;

      return {
        id: order._id,
        state: order.state,
        product: {
          id: product?._id,
          name: product?.name,
          description: product?.description,
          price: product?.price,
          image: product?.image,
          rate: product?.rate,
          countUserRate: product?.countUserRate,
          category: product?.category
            ? {
              id: product.category._id,
              name: product.category.name,
              image: product.category.image,
            }
            : null,
          user: productUser
            ? {
              id: productUser._id,
              email: productUser.email,
              firstName: productUser.firstName,
              lastName: productUser.lastName,
              phone: productUser.phone,
              address: productUser.address,
              isTechnician: productUser.isTechnician,
            }
            : null,
        },
        sender: senderUser
          ? {
            id: senderUser._id,
            email: senderUser.email,
            firstName: senderUser.firstName,
            lastName: senderUser.lastName,
            phone: senderUser.phone,
            address: senderUser.address,
            isTechnician: senderUser.isTechnician,
          }
          : null,
      };
    });
  }
  async findAllReceiver(userId: string) {
    const orders = await this.orderModel
      .find()
      .populate({
        path: 'product',
        match: { user: userId },
        populate: ['category', 'user'],
      })
      .populate('user');

    const filteredOrders = orders.filter(order => order.product);

    if (!filteredOrders.length) {
      return [];
    }

    return filteredOrders.map(order => {
      const product: any = order.product;
      const productUser: any = product?.user;
      const senderUser: any = order.user;

      return {
        id: order._id,
        state: order.state,
        product: {
          id: product?._id,
          name: product?.name,
          description: product?.description,
          price: product?.price,
          image: product?.image,
          rate: product?.rate,
          countUserRate: product?.countUserRate,
          category: product?.category ? {
            id: product.category._id,
            name: product.category.name,
            image: product.category.image,
          } : null,
          user: productUser ? {
            id: productUser._id,
            email: productUser.email,
            firstName: productUser.firstName,
            lastName: productUser.lastName,
            phone: productUser.phone,
            address: productUser.address,
            isTechnician: productUser.isTechnician,
          } : null,
        },
        sender: productUser ? {
          id: senderUser._id,
          email: senderUser.email,
          firstName: senderUser.firstName,
          lastName: senderUser.lastName,
          phone: senderUser.phone,
          address: senderUser.address,
          isTechnician: senderUser.isTechnician,
        } : null,
      };
    });
  }

  async update(id: string, updateOrderDto: UpdateOrderDto, userId: string) {
    const { state } = updateOrderDto;

    const order = await this.orderModel
      .findOne({ _id: id })
      .populate({
        path: 'product',
        populate: ['category', 'user'],
      })
      .populate('user');

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const product: any = order.product;
    const productUser: any = product?.user;

    if (productUser?._id.toString() != userId) {
      throw new BadRequestException('user can not update');
    }

    order.state = state;
    await order.save();

    return {
      id: order._id,
      state: order.state,
      product: {
        id: product?._id,
        name: product?.name,
        description: product?.description,
        price: product?.price,
        image: product?.image,
        rate: product?.rate,
        countUserRate: product?.countUserRate,
        category: product?.category ? {
          id: product.category._id,
          name: product.category.name,
          image: product.category.image,
        } : null,
        user: productUser ? {
          id: productUser._id,
          email: productUser.email,
          firstName: productUser.firstName,
          lastName: productUser.lastName,
          phone: productUser.phone,
          address: productUser.address,
          isTechnician: productUser.isTechnician,
        } : null,
      },
      sender: productUser ? {
        id: productUser._id,
        email: productUser.email,
        firstName: productUser.firstName,
        lastName: productUser.lastName,
        phone: productUser.phone,
        address: productUser.address,
        isTechnician: productUser.isTechnician,
      } : null,
    };
  }
}
