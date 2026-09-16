import { Router } from 'express';
import * as codigosController from '../controllers/codigos.controller';
import { limitadorCanje } from '../middlewares/rate-limit.middleware';

export const codigosRouter = Router();

/**
 * POST /api/codigos/canjear { codigo }
 *
 * Decisión de diseño: el canje es PÚBLICO. Representa el momento en que el código
 * se presenta en la feria, y lo canjea quien lo presenta, así que no depende de la
 * sesión del cliente ni de la del admin. La seguridad está en la validación del
 * formato y en el UPDATE atómico que impide usar un código dos veces.
 * En un sistema real iría detrás de la autenticación del punto de venta, con
 * límite de intentos para frenar a quien pruebe códigos al azar.
 */
codigosRouter.post('/codigos/canjear', limitadorCanje, codigosController.canjear);
