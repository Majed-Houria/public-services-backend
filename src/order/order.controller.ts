import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createOrderDto: CreateOrderDto , @Req() req: any ,) {
    return this.orderService.create(createOrderDto , req.user._id);
  }

  @Get('sender')
  @UseGuards(JwtAuthGuard)
  findAllSender(@Req() req: any) {
    return this.orderService.findAllSender(req.user._id);
  }

  @Get('receiver')
  @UseGuards(JwtAuthGuard)
  findAllReceiver(@Req() req: any) {
    return this.orderService.findAllReceiver(req.user._id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto , @Req() req: any) {
    return this.orderService.update(id, updateOrderDto , req.user._id);
  }
}
