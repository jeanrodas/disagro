import { Router } from 'express';
import { adminRouter } from './admin.routes';
import { catalogoRouter } from './catalogo.routes';
import { codigosRouter } from './codigos.routes';
import { confirmacionRouter } from './confirmacion.routes';
import { portafolioRouter } from './portafolio.routes';

/** Router raíz de la API; cada módulo agrega aquí sus rutas. */
export const apiRouter = Router();

apiRouter.use(catalogoRouter);
apiRouter.use(portafolioRouter);
apiRouter.use(confirmacionRouter);
apiRouter.use(codigosRouter);
apiRouter.use('/admin', adminRouter);
