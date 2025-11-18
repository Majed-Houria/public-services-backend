import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ChangeFavoriteProductDto } from './dto/change_favorite_product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { RatingDto } from './dto/rating.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueName = `${Date.now()}${extname(file.originalname)}`;
        callback(null, uniqueName);
      },
    }),
  }))
  create(@Body() createProductDto: CreateProductDto, @Req() req: any, @UploadedFile() file?: Express.Multer.File) {
    if (file) {
      createProductDto.image = `/uploads/${file.filename}`;
    }
    return this.productService.create(createProductDto, req.user._id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Req() req: any , @Query('ordering') ordering?: string , @Query('category') category?: string , @Query('search') search?: string) {
    return this.productService.findAll(req.user._id  , ordering , category , search );
  }

  @Post('rating')
  @UseGuards(JwtAuthGuard)
  rating(@Body() rateingDto: RatingDto, @Req() req: any) {
    return this.productService.rating(req.user._id, rateingDto);
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

  @Get('homeCards')
  @UseGuards(JwtAuthGuard)
  homeCards(@Req() req: any, @Query('ordering') ordering: string) {
    return this.productService.homeCards(req.user._id , ordering);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.productService.findOne(id, req.user._id);
  }

  @Post('toggle')
  @UseGuards(JwtAuthGuard)
  toggle(@Body() changeFavoriteProductDto: ChangeFavoriteProductDto, @Req() req: any) {
    return this.productService.toggle(changeFavoriteProductDto, req.user._id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.productService.remove(id, req.user._id);
  }


}
