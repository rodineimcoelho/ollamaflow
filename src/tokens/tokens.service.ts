import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokensService {
  private tokenEstimateFactor: number;

  constructor(private readonly configService: ConfigService) {
    const tokenEstimateFactor = parseFloat(
      this.configService.get<string>('TOKEN_ESTIMATE_FACTOR', '3'),
    );

    if (isNaN(tokenEstimateFactor) || tokenEstimateFactor <= 0) {
      throw new Error(
        'Invalid TOKEN_ESTIMATE_FACTOR in configuration. It must be a positive number.',
      );
    }

    this.tokenEstimateFactor = tokenEstimateFactor;
  }

  estimateTokenQuantity(text: string) {
    const wordCount = text.trim().split(/\s+/).length;
    const tokenQuantityEstimate = wordCount * this.tokenEstimateFactor;
    return { wordCount, tokenQuantityEstimate };
  }

  updateTokenEstimateFactor(newFactor: number) {
    if (newFactor <= 0 || isNaN(newFactor)) {
      throw new Error('Token estimate factor must be a positive number.');
    }

    const alpha = 0.1;
    this.tokenEstimateFactor =
      this.tokenEstimateFactor * (1 - alpha) + newFactor * alpha;
  }
}
