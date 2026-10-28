import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getJwtSecret } from './jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: any) {
    if (!payload || !payload.id || (!payload.type && !payload.role)) {
      throw new UnauthorizedException('Invalid or malformed token claims');
    }
    const role = payload.role || payload.type;
    return {
      id: payload.id,
      type: payload.type || role,
      role: role,
      email: payload.email,
    };
  }
}
