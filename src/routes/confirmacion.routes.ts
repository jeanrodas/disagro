import { Router } from 'express';
import * as confirmacionController from '../controllers/confirmacion.controller';
import { limitadorConfirmacion } from '../middlewares/rate-limit.middleware';

export const confirmacionRouter = Router();

/** POST /api/confirmar — con límite por IP para frenar confirmaciones masivas */
confirmacionRouter.post('/confirmar', limitadorConfirmacion, confirmacionController.confirmar);
