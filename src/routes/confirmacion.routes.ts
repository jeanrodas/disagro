import { Router } from 'express';
import * as confirmacionController from '../controllers/confirmacion.controller';

export const confirmacionRouter = Router();

/** POST /api/confirmar */
confirmacionRouter.post('/confirmar', confirmacionController.confirmar);
