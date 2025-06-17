import { Injectable } from '@nestjs/common';

@Injectable()
export class TokensService {
  estimateTokenQuantity(text: string) {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).length * 2.7;
  }
}
