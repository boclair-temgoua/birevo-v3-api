import { User } from '../../models/User';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsBoolean,
  IsOptional,
  IsIn,
  IsUUID,
} from 'class-validator';

export class CreateOrUpdatePostsDto {
  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  groupId: string;
  
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @MinLength(3)
  title: string;
}

export class PostsDto {
  @IsOptional()
  @IsString()
  @IsUUID()
  groupId: string;
}
