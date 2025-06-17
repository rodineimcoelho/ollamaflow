import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { OllamaModule } from './ollama/ollama.module';
import { BullModule } from '@nestjs/bullmq';
import { ContainersModule } from './containers/containers.module';
import { TokensModule } from './tokens/tokens.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          connection: {
            host: configService.get<string>('REDIS_HOST', 'redis'),
            port: parseInt(configService.get<string>('REDIS_PORT', '6379')),
          },
        };
      },
      inject: [ConfigService],
    }),
    HealthModule,
    OllamaModule,
    ContainersModule,
    TokensModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
