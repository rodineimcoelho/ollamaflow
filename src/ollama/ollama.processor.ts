import { HttpService } from '@nestjs/axios';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ContainersService } from 'src/containers/containers.service';
import { GenerateDto } from './dto/generate.dto';
import { TokensService } from 'src/tokens/tokens.service';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { GenerateResponseDto } from './dto/generate-response.dto';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Processor('ollama-jobs', {
  concurrency: parseInt(process.env.OLLAMA_CONCURRENCY || '512', 10),
})
export class OllamaProcessor extends WorkerHost {
  private readonly logger = new Logger(OllamaProcessor.name);

  constructor(
    private readonly tokensService: TokensService,
    private readonly containersService: ContainersService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    super();
    const concurrency = this.configService.get<number>('OLLAMA_CONCURRENCY', 4);
    this.logger.log(`Configured concurrency: ${concurrency}`);
  }

  async process(job: Job<GenerateDto>) {
    const { prompt, model } = job.data;

    this.logger.log(`[Job ${job.id}] Processing for model "${model}"`);

    const { tokenQuantityEstimate, wordCount } =
      this.tokensService.estimateTokenQuantity(prompt);

    this.logger.debug(
      `[Job ${job.id}] Token estimate: ${tokenQuantityEstimate}`,
    );

    const { bestContainer, estimatedWaitTime } =
      this.containersService.getBestContainer(tokenQuantityEstimate);

    this.logger.log(
      `[Job ${job.id}][Container ${bestContainer.name}] Selected container: ${bestContainer.name} (${bestContainer.url})`,
    );

    this.containersService.incrementContainerQueueLenght(
      bestContainer,
      tokenQuantityEstimate,
    );

    try {
      this.logger.debug(
        `[Job ${job.id}][Container ${bestContainer.name}] Sending request to ${bestContainer.url}/api/generate`,
      );
      const startTime = Date.now();
      const { data }: AxiosResponse<GenerateResponseDto> = await firstValueFrom(
        this.httpService.post(`${bestContainer.url}/api/generate`, {
          model,
          prompt,
          stream: false,
          format: 'json',
        }),
      );
      const duration = Date.now() - startTime;

      this.logger.log(
        `[Job ${job.id}][Container ${bestContainer.name}] Expected time: ${estimatedWaitTime.toFixed(2)} ms, real time: ${duration.toFixed(2)} ms`,
      );

      this.logger.debug(
        `[Job ${job.id}][Container ${bestContainer.name}] Response: ${JSON.stringify(data)}`,
      );

      const { eval_count, prompt_eval_count } = data;
      const totalTokens = eval_count + prompt_eval_count;
      const timePerToken = duration / totalTokens;

      this.logger.debug(
        `[Job ${job.id}][Container ${bestContainer.name}] Token estimate: ${tokenQuantityEstimate}, real: ${totalTokens}`,
      );

      this.tokensService.updateTokenEstimateFactor(totalTokens / wordCount);

      this.containersService.updateContainerQueueWeight(
        bestContainer,
        duration,
        estimatedWaitTime,
      );

      this.logger.debug(
        `[Job ${job.id}][Container ${bestContainer.name}] Updating timePerToken: ${timePerToken}`,
      );

      this.containersService.updateContainerTimePerToken(
        bestContainer,
        timePerToken,
      );

      this.logger.log(
        `[Job ${job.id}][Container ${bestContainer.name}] Processed successfully.`,
      );

      return data as unknown;
    } catch (error: unknown) {
      let errorMessage = 'Unknown error';
      let errorStack = '';

      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as { message: string }).message;
        errorStack = (error as { stack?: string }).stack ?? '';
      }

      this.logger.error(
        `Error processing job ${job.id}: ${errorMessage}`,
        errorStack,
      );

      throw error;
    } finally {
      this.logger.debug(
        `[Job ${job.id}][Container ${bestContainer.name}] Decrementing queue`,
      );

      this.containersService.decrementContainerQueueLenght(
        bestContainer,
        tokenQuantityEstimate,
      );
    }
  }
}
