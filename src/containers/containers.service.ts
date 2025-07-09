import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Container } from './container';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ContainersService {
  private containers: Container[];
  private queueWeightAlpha: number;
  private timePerTokenAlpha: number;

  constructor(private readonly configService: ConfigService) {
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
          (c.timePerToken == null &&
            (!c.queueLengthInTokens || c.queueLengthInTokens === 0)),
      );
    } else {
      candidates = this.containers;
    }

    let bestContainer: Container | null = null;
    let bestEstimatedWaitTime: number | null = null;

    for (const container of candidates) {
      const queue = container.queueLengthInTokens ?? 0;
      const timePerToken = container.timePerToken ?? 0;
      const queueWeight = container.queueWeight ?? 1;

      const estimatedWaitTime =
        (queue * queueWeight + tokenQuantityToSend) * timePerToken;

      if (
        bestContainer === null ||
        estimatedWaitTime < (bestEstimatedWaitTime as number) ||
        (estimatedWaitTime === bestEstimatedWaitTime &&
          queue < (bestContainer.queueLengthInTokens ?? 0))
      ) {
        bestContainer = container;
        bestEstimatedWaitTime = estimatedWaitTime;
      }
    }

    return {
      bestContainer: bestContainer as Container,
      estimatedWaitTime: bestEstimatedWaitTime as number,
    };
  }

  incrementContainerQueueLenght(container: Container, tokens: number) {
    container.queueLengthInTokens =
      (container.queueLengthInTokens ?? 0) + tokens;
  }

  decrementContainerQueueLenght(container: Container, tokens: number) {
    container.queueLengthInTokens = Math.max(
      (container.queueLengthInTokens ?? 0) - tokens,
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
    const ratio = realTime / expectedTime;
    const alpha = this.queueWeightAlpha;
    const queueWeight = container.queueWeight ?? 1;

    container.queueWeight = Math.max(
      0,
      Math.min(1, queueWeight * (1 + alpha * (ratio - 1))),
    );
  }
}
