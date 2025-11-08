export class Container {
  name: string;
  url: string;
  timePerToken?: number | null;
  queueLengthInCharacters?: number | null;
  queueWeight?: number;
}
