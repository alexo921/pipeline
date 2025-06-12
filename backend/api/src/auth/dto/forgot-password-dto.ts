import { IsEmail } from "class-validator";

export class ForgotPassDto{
    @IsEmail()
    email:string
}