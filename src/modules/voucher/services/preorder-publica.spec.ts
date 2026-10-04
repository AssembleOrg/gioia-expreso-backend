import { ciudadDe, esPersonal, preordenPublica } from './preorder-publica';

describe('preorden pública', () => {
  const p = {
    id: '1',
    voucherNumber: 'VCH-1',
    notes: 'Destinatario: Ana - DNI: 30111222 - Tel: 3415550000',
    client: {
      id: 'c',
      fullname: 'Juan Pérez',
      email: 'juan@x.com',
      phone: '1144445555',
      cuit: '20-12345678-9',
      address: 'Mitre 100, Lanús, Buenos Aires',
    },
  };

  it('del cliente deja sólo nombre y ciudad, y saca las notas', () => {
    const r = preordenPublica(p);
    expect(r.client).toEqual({ fullname: 'Juan Pérez', city: 'Lanús' });
    expect(r.notes).toBeNull();
    expect(JSON.stringify(r)).not.toMatch(/juan@x\.com|1144445555|20-12345678-9|30111222|3415550000|Mitre/);
    expect(r.voucherNumber).toBe('VCH-1');
  });

  it('ciudad según cómo se cargó la dirección', () => {
    expect(ciudadDe('Calle 1, CABA')).toBe('CABA');
    expect(ciudadDe('Mitre 100, Lanús, Buenos Aires')).toBe('Lanús');
    expect(ciudadDe('Sin coma')).toBeNull();
    expect(ciudadDe(null)).toBeNull();
  });

  it('sólo ADMIN y SUBADMIN ven el detalle completo', () => {
    expect(esPersonal({ role: 'ADMIN' })).toBe(true);
    expect(esPersonal({ role: 'SUBADMIN' })).toBe(true);
    expect(esPersonal({ role: 'USER' })).toBe(false);
    expect(esPersonal(undefined)).toBe(false);
  });
});
