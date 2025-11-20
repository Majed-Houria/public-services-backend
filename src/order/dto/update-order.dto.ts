
import { IsString } from "class-validator";

export class UpdateOrderDto {
    @IsString()
    state: string;
}
