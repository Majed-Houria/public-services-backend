import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateProductDto {
    @IsString()
    name: string;

    @IsString()
    description: string;

    @IsString()
    price: number;

    @IsString()
    categoryName: string;

    @IsString()
    @IsOptional()
    image ?: string;
}
