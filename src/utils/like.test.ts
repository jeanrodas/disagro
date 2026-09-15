import { describe, expect, it } from 'vitest';
import { escaparComodinesLike } from './like';

describe('escaparComodinesLike', () => {
  it('escapa %, _ y la barra invertida', () => {
    expect(escaparComodinesLike('100%')).toBe('100\\%');
    expect(escaparComodinesLike('a_b')).toBe('a\\_b');
    expect(escaparComodinesLike('c:\\x')).toBe('c:\\\\x');
  });

  it('deja intacto el texto normal, con tildes', () => {
    expect(escaparComodinesLike('María González')).toBe('María González');
  });
});
