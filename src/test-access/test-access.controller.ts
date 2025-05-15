import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

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
