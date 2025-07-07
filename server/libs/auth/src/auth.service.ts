import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '@app/database';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '@app/database';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';

@Injectable()
export class AuthService {

    constructor(
        private readonly UserRepo: UserService,
        private readonly jwtService: JwtService,
    ) {
    }

    async validateUser(SignInDto:SignInDto): Promise<Partial<User> | null> {
        const user = await this.UserRepo.findByEmail(SignInDto.email);
        if (user && await bcrypt.compare(SignInDto.password, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    login(user: User) {
        const payload = { ...user };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async register(data: SignUpDto): Promise<Partial<User>> {
        const existing = await this.UserRepo.findByEmail(data.email);
        if (existing) throw new UnauthorizedException('User already exists');
        const {password,...user}= await this.UserRepo.createNewUser({
            name: data.name,
            email: data.email,
            password: await bcrypt.hash(data.password, 10)
        });
        return user;
    }

    async delete(id:string):Promise<boolean>{
        return this.UserRepo.delete(id);
    }
}
