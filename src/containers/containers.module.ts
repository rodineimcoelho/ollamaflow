import { Module } from '@nestjs/common';
import { ContainersService } from './containers.service';
import { ConfigModule } from '@nestjs/config';
import { TokensModule } from 'src/tokens/tokens.module';

@Module({
  imports: [ConfigModule, TokensModule],
  providers: [ContainersService],
  exports: [ContainersService],
})
export class ContainersModule {}
