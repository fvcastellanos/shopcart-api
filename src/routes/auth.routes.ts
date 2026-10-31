import { Router } from 'express';
import { login, logout, refresh, register } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../schemas/auth.schema.js';

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registra un cliente
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RegisterRequest' }
 *     responses:
 *       201:
 *         description: Cliente creado (refresh token en cookie httpOnly)
 *         headers:
 *           Set-Cookie:
 *             schema: { type: string }
 *             description: refreshToken=<token>; HttpOnly
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       422: { description: Correo ya registrado }
 * /auth/login:
 *   post:
 *     summary: Inicia sesión
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LoginRequest' }
 *     responses:
 *       200:
 *         description: Access token (refresh token en cookie httpOnly)
 *         headers:
 *           Set-Cookie:
 *             schema: { type: string }
 *             description: refreshToken=<token>; HttpOnly
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       401: { description: Credenciales inválidas }
 * /auth/refresh:
 *   post:
 *     summary: Renueva tokens usando la cookie httpOnly de refresh token
 *     tags: [Autenticación]
 *     parameters:
 *       - in: cookie
 *         name: refreshToken
 *         schema: { type: string }
 *         description: Cookie httpOnly con el refresh token
 *     responses:
 *       200:
 *         description: Nuevo access token (rotación del refresh token)
 *         headers:
 *           Set-Cookie:
 *             schema: { type: string }
 *             description: refreshToken=<nuevo>; HttpOnly
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       401: { description: Refresh token inválido o revocado }
 * /auth/logout:
 *   post:
 *     summary: Cierra sesión (revoca el refresh token y limpia la cookie)
 *     tags: [Autenticación]
 *     parameters:
 *       - in: cookie
 *         name: refreshToken
 *         schema: { type: string }
 *     responses:
 *       204: { description: Sesión cerrada }
 */
export const authRouter = Router();

authRouter.post('/register', validate({ body: registerSchema }), register);
authRouter.post('/login', validate({ body: loginSchema }), login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', logout);
