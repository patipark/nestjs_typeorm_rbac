import { Module } from '@nestjs/common';
import { TestAccessController } from './test-access.controller';

@Module({
  controllers: [TestAccessController],
})
export class TestAccessModule {}
