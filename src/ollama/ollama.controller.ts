import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { GenerateDto } from './dto/generate.dto';
import { OllamaService } from './ollama.service';

@Controller('ollama')
export class OllamaController {
  constructor(private readonly ollamaService: OllamaService) {}

  @Post('generate')
  @HttpCode(200)
  generate(@Body() generateDto: GenerateDto) {
    return this.ollamaService.enqueueGenerateJobAndAwait(generateDto);
  }
}
