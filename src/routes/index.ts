import { Router } from 'express';
import { catalogoRouter } from './catalogo.routes';

/** Router raíz de la API; cada módulo agrega aquí sus rutas. */
export const apiRouter = Router();

apiRouter.use(catalogoRouter);
