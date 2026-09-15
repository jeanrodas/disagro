import type { RequestHandler } from 'express';
import { canjearCodigoSchema } from '../schemas/codigos.schema';
import * as codigosService from '../services/codigos.service';
import { validar } from '../utils/validacion';

/** POST /api/codigos/canjear */
export const canjear: RequestHandler = async (req, res) => {
  const { codigo } = validar(canjearCodigoSchema, req.body, 'Código inválido');

  const canjeado = await codigosService.canjearCodigo(codigo);

  res.json({ mensaje: 'Código canjeado correctamente', codigo: canjeado });
};
