import { describe, expect, it } from 'vitest';
import { canjearCodigoSchema } from './codigos.schema';

const validar = (codigo: unknown) => canjearCodigoSchema.safeParse({ codigo });

describe('canjearCodigoSchema', () => {
  it('acepta códigos de servicio y de producto', () => {
    expect(validar('DISAGRO-SERV-XR8TKF').success).toBe(true);
    expect(validar('DISAGRO-PROD-MQGUZT').success).toBe(true);
  });

  it('normaliza espacios y minúsculas', () => {
    expect(validar('  disagro-serv-xr8tkf ').data).toEqual({ codigo: 'DISAGRO-SERV-XR8TKF' });
  });

  it.each([
    ['HOLA'],
    ['DISAGRO-XXXX-ABCDEF'], // tipo desconocido
    ['DISAGRO-SERV-ABCDE'], // 5 caracteres
    ['DISAGRO-SERV-ABCDEFG'], // 7 caracteres
    ['DISAGRO-SERV-O0I1LA'], // caracteres ambiguos que el generador nunca usa
    ['xDISAGRO-SERV-XR8TKF'], // basura antes del código
  ])('rechaza el formato inválido %s', (codigo) => {
    const resultado = validar(codigo);
    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0]?.message).toContain('DISAGRO-SERV-XXXXXX');
  });

  it('rechaza codigo ausente o que no es texto', () => {
    expect(canjearCodigoSchema.safeParse({}).success).toBe(false);
    expect(validar(123456).success).toBe(false);
    expect(canjearCodigoSchema.safeParse(null).success).toBe(false);
  });
});
