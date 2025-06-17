import { IsString } from 'class-validator';

export class GenerateDto {
  @IsString()
  prompt: string;

  @IsString()
  model: string;
}
