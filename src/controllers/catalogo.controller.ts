import type { RequestHandler } from 'express';
import { filtrosItemsSchema } from '../schemas/catalogo.schema';
import * as catalogoService from '../services/catalogo.service';
import { validar } from '../utils/validacion';

/**
 * Capa HTTP del catálogo: traduce la petición a una llamada al servicio y el
 * resultado a JSON. Los errores (validación o BD) los atrapa Express 5 y los
 * formatea el middleware de errores.
 */

export const listarItems: RequestHandler = async (req, res) => {
  const filtros = validar(filtrosItemsSchema, req.query, 'Filtros de búsqueda inválidos');
  const items = await catalogoService.listarItems(filtros);
  res.json({ total: items.length, items });
};

export const listarCategorias: RequestHandler = async (_req, res) => {
  const categorias = await catalogoService.listarCategorias();
  res.json({ total: categorias.length, categorias });
};
