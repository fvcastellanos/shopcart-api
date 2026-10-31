import { Router } from 'express';
import { health } from '../controllers/actuators/health.controller.js';
import { info } from '../controllers/actuators/info.controller.js';

/**
 * @swagger
 * /actuator/health:
 *   get:
 *     summary: Estado de salud del servicio
 *     tags: [Actuator]
 *     responses:
 *       200:
 *         description: Servicio en línea
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string }
 *                 service: { type: string }
 *                 timestamp: { type: string, format: date-time }
 * /actuator/info:
 *   get:
 *     summary: Información de la aplicación (nombre, versión, commit, tag, rama)
 *     tags: [Actuator]
 *     responses:
 *       200:
 *         description: Metadata de la aplicación
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BuildInfo' }
 */
export const actuatorRouter = Router();

actuatorRouter.get('/health', health);
actuatorRouter.get('/info', info);
