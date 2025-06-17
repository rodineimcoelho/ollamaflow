import { Injectable } from '@nestjs/common';
import { GenerateDto } from './dto/generate.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, QueueEvents } from 'bullmq';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OllamaService {
  private queueEvents: QueueEvents;

  constructor(
    @InjectQueue('ollama-jobs') private queue: Queue,
    private readonly configService: ConfigService,
  ) {
    this.queueEvents = new QueueEvents('ollama-jobs', {
      connection: {
        host: this.configService.get<string>('REDIS_HOST', 'localhost'),
        port: parseInt(
          this.configService.get<string>('REDIS_PORT', '6379'),
          10,
        ),
      },
    });
  }

  async enqueueGenerateJobAndAwait(generateDto: GenerateDto) {
    const job = await this.queue.add('generate', generateDto);
    const response: unknown = await job.waitUntilFinished(this.queueEvents);
    return response;
  }
}
