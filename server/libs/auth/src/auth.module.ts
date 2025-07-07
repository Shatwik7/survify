import { Module } from '@nestjs/common';
import { DatabaseModule } from '@app/database';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync(
      {
        imports: [ConfigModule],
        "inject": [ConfigService],
        "useFactory": (config: ConfigService) => {
          return ({
            secret: config.get<string>('JWT_SECRET') || 'jwt-secret',
            signOptions: { expiresIn: config.get<string>('JWT_EXPIRATION') || '1d' },
          })
        }
      }
    ),
    DatabaseModule],
  providers: [AuthService, LocalStrategy, JwtStrategy, JwtAuthGuard, LocalAuthGuard],
  exports: [AuthService, JwtAuthGuard, LocalAuthGuard],
})
export class AuthModule { }
