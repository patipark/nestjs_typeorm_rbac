import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeedManager } from './seed-manager.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Seed');
  logger.log('Starting database seeding...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    logger.log('Getting SeedManager...');
    const seedService = app.get(SeedManager);
    
    logger.log('Running seedAll()...');
    await seedService.seedAll();
    
    logger.log('Seeding completed successfully!');
  } catch (error) {
    logger.error(`Error during seeding: ${error.message}`);
    logger.error(error.stack);
  } finally {
    await app.close();
  }
}

bootstrap();
