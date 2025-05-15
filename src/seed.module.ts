import { Module } from '@nestjs/common';
import { CommandModule } from 'nestjs-command';
import { AppModule } from './app.module';
import { SeedService } from './seed.service';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    CommandModule,
    AppModule,
    RolesModule,
    UsersModule,
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
