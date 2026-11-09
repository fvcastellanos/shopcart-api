import passport from 'passport';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import type { StrategyOptions } from 'passport-jwt';
import { env } from '../config/env.js';
import type { AuthUser, Role } from '../types/auth.js';

const options: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: env.JWT_ACCESS_SECRET,
};

passport.use(
  new JwtStrategy(options, (payload, done) => {
    // El token se firma en services/auth.service.ts con { id, email, rol, name }.
    const user: AuthUser = {
      id: payload.id as number,
      email: payload.email as string,
      rol: payload.rol as Role,
      name: payload.name as string | undefined,
    };

    return done(null, user);
  }),
);

export { passport };
