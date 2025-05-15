import { Module, Controller, Get, UseGuards } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { AuthModule } from './auth/auth.module';
import { SeedManager } from './seed-manager.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';

@Controller('test-access')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TestAccessController {
  @Get('public')
  public() {
    return { message: 'This endpoint is accessible to all authenticated users' };
  }

  @Get('user')
  @Roles('user')
  user() {
    return { message: 'This endpoint requires user role' };
  }

  @Get('editor')
  @Roles('editor')
  editor() {
    return { message: 'This endpoint requires editor role' };
  }

  @Get('manager')
  @Roles('manager')
  manager() {
    return { message: 'This endpoint requires manager role' };
  }

  @Get('admin')
  @Roles('admin')
  admin() {
    return { message: 'This endpoint requires admin role' };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true, // Makes the module available throughout the application
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => getDatabaseConfig(configService),
    }),
    UsersModule,
    RolesModule,
    AuthModule,
  ],
  controllers: [AppController, TestAccessController],
  providers: [AppService, SeedManager],
  exports: [SeedManager],
})
export class AppModule {}
