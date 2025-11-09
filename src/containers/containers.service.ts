import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Container } from './container';
import * as fs from 'fs';
import * as path from 'path';
import { TokensService } from 'src/tokens/tokens.service';

@Injectable()
export class ContainersService {
  private readonly logger = new Logger(ContainersService.name);
  private containers: Container[];
  private queueWeightAlpha: number;
  private timePerTokenAlpha: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly tokensService: TokensService,
  ) {
    this.containers = this.loadContainersConfig();
    this.queueWeightAlpha = parseFloat(
      this.configService.get<string>('QUEUE_WEIGHT_ALPHA') ?? '0.1',
    );
    this.timePerTokenAlpha = parseFloat(
      this.configService.get<string>('TIME_PER_TOKEN_ALPHA') ?? '0.1',
    );
  }

  private loadContainersConfig(): Container[] {
    const configPath = path.join(__dirname, '../../containers.config.json');
    try {
      const data = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(data) as Container[];
    } catch (error) {
      throw new Error(`Error loading containers: ${error}`);
    }
  }

  getBestContainer(tokenQuantityToSend: number) {
    const isThereContainersWithTime = this.containers.some(
      (c) => c.timePerToken != null,
    );

    let candidates: Container[] = [];
    if (isThereContainersWithTime) {
      candidates = this.containers.filter(
        (c) =>
          c.timePerToken != null ||
          (c.timePerToken == null && !c.queueLengthInCharacters),
      );
    } else {
      candidates = this.containers;
    }

    let bestContainer: Container | null = null;
    let bestEstimatedWaitTime: number | null = null;

    for (const container of candidates) {
      const queueLenghtInCharacters = container.queueLengthInCharacters ?? 0;
      const queueLenghtInTokens =
        this.tokensService.calculateTokensByCharacters(queueLenghtInCharacters);

      const timePerToken = container.timePerToken ?? 0;
      const queueWeight = container.queueWeight ?? 1;

      const estimatedWaitTime =
        (queueLenghtInTokens * queueWeight + tokenQuantityToSend) *
        timePerToken;

      if (
        bestContainer === null ||
        estimatedWaitTime < (bestEstimatedWaitTime as number) ||
        (estimatedWaitTime === bestEstimatedWaitTime &&
          queueLenghtInTokens < (bestContainer.queueLengthInCharacters ?? 0))
      ) {
        bestContainer = container;
        bestEstimatedWaitTime = estimatedWaitTime;
      }
    }

    return {
      bestContainer: bestContainer as Container,
      estimatedWaitTime: bestEstimatedWaitTime as number,
      estimatedTimePerToken: bestContainer?.timePerToken ?? 0,
    };
  }

  incrementContainerQueueLenght(container: Container, charactersCount: number) {
    container.queueLengthInCharacters =
      (container.queueLengthInCharacters ?? 0) + charactersCount;
  }

  decrementContainerQueueLenght(container: Container, charactersCount: number) {
    container.queueLengthInCharacters = Math.max(
      (container.queueLengthInCharacters ?? 0) - charactersCount,
      0,
    );
  }

  updateContainerTimePerToken(container: Container, timePerToken: number) {
    const alpha = this.timePerTokenAlpha;
    container.timePerToken =
      container.timePerToken == null
        ? timePerToken
        : container.timePerToken * (1 - alpha) + timePerToken * alpha;
  }

  updateContainerQueueWeight(
    container: Container,
    realTime: number,
    expectedTime: number,
  ) {
    if (expectedTime === 0) {
      this.logger.debug(
        `Expected time is 0 for container ${container.name}, skipping queue weight update.`,
      );
      return;
    }

    const ratio = realTime / expectedTime;
    const alpha = this.queueWeightAlpha;
    const queueWeight = container.queueWeight ?? 1;

    const newQueueWeight = Math.max(
      0,
      Math.min(2, queueWeight * (1 + alpha * (ratio - 1))),
    );

    this.logger.debug(
      `Updating queue weight for container ${container.name}: ${newQueueWeight} = ${queueWeight} * (1 + ${alpha} * (${ratio} - 1))`,
    );

    container.queueWeight = newQueueWeight;
  }
}
