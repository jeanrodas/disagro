import { Router } from 'express';
import { catalogoRouter } from './catalogo.routes';
import { portafolioRouter } from './portafolio.routes';

/** Router raíz de la API; cada módulo agrega aquí sus rutas. */
export const apiRouter = Router();

apiRouter.use(catalogoRouter);
apiRouter.use(portafolioRouter);
