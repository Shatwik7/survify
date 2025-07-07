import { AuthModule } from '@app/auth';
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';

@Module({
    imports: [AuthModule],
    controllers: [UserController]
})
export class UserModule { }
