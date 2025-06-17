import { Injectable } from '@nestjs/common';
import { Container } from './container';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ContainersService {
  private containers: Container[];

  constructor() {
    const configPath = path.join(__dirname, '../../containers.config.json');
    this.containers = JSON.parse(
      fs.readFileSync(configPath, 'utf-8'),
    ) as Container[];
  }

  getBestContainer(tokenQuantityToSend: number) {
    let bestContainer: Container = this.containers[0];
    let bestEstimatedWaitTime = 0;

    for (const container of this.containers) {
      const estimatedWaitTime =
        (container.queueLenghtInTokens + tokenQuantityToSend) *
        container.timePerToken;

      if (!bestContainer) {
        bestContainer = container;
        bestEstimatedWaitTime = estimatedWaitTime;
      } else if (estimatedWaitTime < bestEstimatedWaitTime) {
        bestContainer = container;
        bestEstimatedWaitTime = estimatedWaitTime;
      }
    }

    return { bestContainer, estimatedWaitTime: bestEstimatedWaitTime };
  }

  estimateWaitTime(container: Container, tokenQuantityToSend: number) {
    return (
      (container.queueLenghtInTokens + tokenQuantityToSend) *
      container.timePerToken
    );
  }

  incrementContainerQueueLenght(container: Container, tokens: number) {
    container.queueLenghtInTokens += tokens;
  }

  decrementContainerQueueLenght(container: Container, tokens: number) {
    container.queueLenghtInTokens -= tokens;
  }

  updateContainerTimePerToken(container: Container, timePerToken: number) {
    const alpha = 0.1;

    container.timePerToken =
      container.timePerToken * (1 - alpha) + timePerToken * alpha;

    container.timePerToken = timePerToken;
  }
}
