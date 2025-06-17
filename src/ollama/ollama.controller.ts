import { Body, Controller, Post } from '@nestjs/common';
import { GenerateDto } from './dto/generate.dto';
import { OllamaService } from './ollama.service';

@Controller('ollama')
export class OllamaController {
  constructor(private readonly ollamaService: OllamaService) {}

  @Post('generate')
  generate(@Body() generateDto: GenerateDto) {
    return this.ollamaService.enqueueGenerateJobAndAwait(generateDto);
  }
}
