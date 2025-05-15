import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  return {
    type: configService.get<string>('DB_DIALECT') as 'mariadb',
    host: configService.get<string>('DB_HOST'),
    port: parseInt(configService.get<string>('DB_PORT', '3306'), 10),
    username: configService.get<string>('DB_USER'),
    password: configService.get<string>('DB_PASS'),
    database: configService.get<string>('DB_NAME'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: true, // Enable synchronize for development to auto-create the role_hierarchy table
    logging: configService.get<string>('NODE_ENV') === 'development',
    charset: 'utf8mb4',
    // Add these options to fix authentication issues
    ssl: false,
    extra: {
      authPlugin: 'mysql_native_password',
    }
  };
};