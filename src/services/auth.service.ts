import { createHash } from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ConflictError, UnauthorizedError } from '../lib/errors.js';
import * as usuarioRepository from '../repositories/usuario.repository.js';
import * as tokenSesionRepository from '../repositories/tokenSesion.repository.js';
import type { AuthUser } from '../types/auth.js';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function issueTokens(user: AuthUser): Promise<TokenPair> {
  const payload = { id: user.id, email: user.email, rol: user.rol };
  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
  } as jwt.SignOptions);
  const refreshToken = jwt.sign({ sub: user.id }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL,
  } as jwt.SignOptions);

  // Se almacena solo el hash del refresh token, con su fecha de expiración real.
  const decoded = jwt.decode(refreshToken) as jwt.JwtPayload;
  const fechaExpiracion = new Date((decoded.exp ?? Math.floor(Date.now() / 1000)) * 1000);

  await tokenSesionRepository.crearTokenSesion({
    idUsuario: user.id,
    refreshTokenHash: hashToken(refreshToken),
    fechaExpiracion,
  });

  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput): Promise<TokenPair> {
  const existing = await usuarioRepository.consultarPorCorreo(input.email);
  if (existing) {
    throw new ConflictError('El correo ya está registrado.');
  }
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await usuarioRepository.crearCliente({
    email: input.email,
    passwordHash,
    nombre: input.nombre,
  });
  return issueTokens(user);
}

export async function login(input: LoginInput): Promise<TokenPair> {
  const user = await usuarioRepository.consultarPorCorreo(input.email);
  if (!user || !user.activo) {
    throw new UnauthorizedError('Credenciales inválidas.');
  }
  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Credenciales inválidas.');
  }
  return issueTokens(user);
}

export async function refresh(refreshToken: string): Promise<TokenPair> {
  try {
    jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw new UnauthorizedError('Refresh token inválido o expirado.');
  }

  const tokenHash = hashToken(refreshToken);
  const session = await tokenSesionRepository.consultarTokenSesionActivo(tokenHash);
  if (!session) {
    throw new UnauthorizedError('Refresh token inválido o revocado.');
  }

  // Rotación: revocar el token actual antes de emitir uno nuevo.
  await tokenSesionRepository.revocarTokenSesion(tokenHash);

  const user = await usuarioRepository.consultarPorID(session.idUsuario);
  if (!user || !user.activo) {
    throw new UnauthorizedError('Usuario inactivo.');
  }

  return issueTokens(user);
}
