import type { CookieOptions, Request, Response } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as authService from '../services/auth.service.js';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../lib/errors.js';

const REFRESH_TOKEN_COOKIE = 'refreshToken';

function refreshTokenCookieOptions(expiresAt: Date): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.max(0, expiresAt.getTime() - Date.now()),
  };
}

function clearCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };
}

function readRefreshToken(req: Request): string | undefined {
  const fromCookie = req.cookies?.[REFRESH_TOKEN_COOKIE];
  const fromBody = req.body?.refreshToken;
  if (typeof fromCookie === 'string' && fromCookie.length > 0) return fromCookie;
  if (typeof fromBody === 'string' && fromBody.length > 0) return fromBody;
  return undefined;
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const tokens = await authService.register(req.body);
  res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, refreshTokenCookieOptions(tokens.refreshTokenExpiresAt));
  res.status(201).json({ accessToken: tokens.accessToken });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const tokens = await authService.login(req.body);
  res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, refreshTokenCookieOptions(tokens.refreshTokenExpiresAt));
  res.status(200).json({ accessToken: tokens.accessToken });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = readRefreshToken(req);
  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token requerido.');
  }
  const tokens = await authService.refresh(refreshToken);
  res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, refreshTokenCookieOptions(tokens.refreshTokenExpiresAt));
  res.status(200).json({ accessToken: tokens.accessToken });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(readRefreshToken(req));
  res.clearCookie(REFRESH_TOKEN_COOKIE, clearCookieOptions());
  res.status(204).send();
});
