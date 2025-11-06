import { IsNumber, IsString } from "class-validator";

export class ChangeFavoriteProductDto {
    @IsString()
    id: string;
}
