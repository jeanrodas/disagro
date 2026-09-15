import { Router } from 'express';
import * as portafolioController from '../controllers/portafolio.controller';
import { requiereSesionCliente } from '../middlewares/sesion-cliente.middleware';

export const portafolioRouter = Router();

/** GET /api/portafolio (cookie de sesión) */
portafolioRouter.get('/portafolio', requiereSesionCliente, portafolioController.obtenerPortafolio);

/** POST /api/sesion { token } (enlace del correo => cookie) */
portafolioRouter.post('/sesion', portafolioController.iniciarSesionConEnlace);
