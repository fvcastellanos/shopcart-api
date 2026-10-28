import { Router } from 'express';
import { health } from '../controllers/actuators/health.controller.js';
import { info } from '../controllers/actuators/info.controller.js';

export const actuatorRouter = Router();

actuatorRouter.get('/health', health);
actuatorRouter.get('/info', info);
