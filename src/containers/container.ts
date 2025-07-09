export class Container {
  name: string;
  url: string;
  timePerToken?: number | null;
  queueLengthInTokens?: number | null;
  queueWeight?: number;
}
