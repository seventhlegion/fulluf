import * as fs from 'node:fs';
import * as path from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const dbPath = process.env.DATABASE_PATH ?? './data/chat.db';
  const dbDir = path.isAbsolute(dbPath) ? path.dirname(dbPath) : path.join(process.cwd(), path.dirname(dbPath));
  fs.mkdirSync(dbDir, { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), 'uploads'), { recursive: true });
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true }); // Allow all origins for PWA/mobile
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
}

void bootstrap();
