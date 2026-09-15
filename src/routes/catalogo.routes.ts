import { Router } from 'express';
import * as catalogoController from '../controllers/catalogo.controller';

export const catalogoRouter = Router();

/** GET /api/items?tipo=&categoria=&buscar= */
catalogoRouter.get('/items', catalogoController.listarItems);

/** GET /api/categorias */
catalogoRouter.get('/categorias', catalogoController.listarCategorias);
