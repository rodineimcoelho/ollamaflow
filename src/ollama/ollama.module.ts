import { Module } from '@nestjs/common';
import { OllamaController } from './ollama.controller';
import { OllamaService } from './ollama.service';
import { TokensModule } from 'src/tokens/tokens.module';
import { BullModule } from '@nestjs/bullmq';
import { OllamaProcessor } from './ollama.processor';
import { ContainersModule } from 'src/containers/containers.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueueAsync({
      name: 'ollama-jobs',
    }),
    HttpModule,
    TokensModule,
    ContainersModule,
  ],
  controllers: [OllamaController],
  providers: [OllamaService, OllamaProcessor],
})
export class OllamaModule {}
