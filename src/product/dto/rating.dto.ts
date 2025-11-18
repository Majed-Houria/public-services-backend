import { IsNumber, IsString } from "class-validator";

export class RatingDto {
    @IsString()
    id: string;

    @IsNumber()
    rate: number;
}
