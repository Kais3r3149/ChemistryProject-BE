import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'abc123token...' })
  @IsNotEmpty()
  @IsString()
  token!: string;

  @ApiProperty({ example: 'newPassword456', minLength: 6 })
  @IsNotEmpty()
  @MinLength(6)
  newPassword!: string;
}
