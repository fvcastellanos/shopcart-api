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
    // El token se firma en services/auth.service.ts con { id, email, rol }.
    const user: AuthUser = {
      id: payload.id as number,
      email: payload.email as string,
      rol: payload.rol as Role,
    };
    // TODO (opcional): validar contra BD que el usuario siga activo
    // (SP_Usuarios_ConsultarActivo) antes de aceptar el token.
    return done(null, user);
  }),
);

export { passport };
