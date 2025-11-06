import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ChangeFavoriteProductDto } from './dto/ChangeFavoriteProductDto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createProductDto: CreateProductDto, @Req() req: any) {
    return this.productService.create(createProductDto, req.user._id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Req() req: any) {
    return this.productService.findAll(req.user._id);
  }

  @Get('favorite')
  @UseGuards(JwtAuthGuard)
  favorite(@Req() req: any) {
    return this.productService.favorite(req.user._id);
  }

  @Get('service')
  @UseGuards(JwtAuthGuard)
  services(@Req() req: any) {
    return this.productService.service(req.user._id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.productService.remove(id, req.user._id);
  }

  @Post('toggle')
  @UseGuards(JwtAuthGuard)
  toggle(@Body() changeFavoriteProductDto: ChangeFavoriteProductDto, @Req() req: any) {
    return this.productService.toggle(changeFavoriteProductDto, req.user._id);
  }
}
