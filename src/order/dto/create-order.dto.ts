import { IsNumber, IsString } from "class-validator";

export class CreateOrderDto {
    @IsString()
    id: string;
}
