import { Module } from '@nestjs/common';
import { ContainersService } from './containers.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [ContainersService],
  exports: [ContainersService],
})
export class ContainersModule {}
