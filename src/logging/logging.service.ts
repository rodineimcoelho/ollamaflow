import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LoggingService {
  private readonly startExecutionDate: Date;
  private readonly logBasePath: string;
  private readonly currentRunPath: string;

  constructor() {
    this.startExecutionDate = new Date();
    this.logBasePath = path.resolve(process.cwd(), 'logs');
    this.currentRunPath = path.join(
      this.logBasePath,
      this.formatDate(this.startExecutionDate),
    );
    try {
      fs.mkdirSync(this.currentRunPath, { recursive: true });
    } catch (err) {
      console.error('Falha ao criar diretório de logs:', err);
    }
  }

  private formatDate(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate(),
    )}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(
      date.getSeconds(),
    )}`;
  }

  private getLogFilePath(filename: string): string {
    return path.join(this.currentRunPath, filename);
  }

  logEstimateComparison(
    estimateName: string,
    estimate: number,
    actual: number,
  ) {
    const logFilePath = this.getLogFilePath(`${estimateName}.csv`);

    const timestamp = new Date().toISOString();
    const newLine = `${timestamp},${estimate},${actual}\n`;

    if (!fs.existsSync(logFilePath)) {
      fs.writeFileSync(logFilePath, 'timestamp,estimated_value,actual_value\n');
    }

    fs.appendFileSync(logFilePath, newLine);
  }
}
