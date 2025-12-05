# API de Facturación Electrónica AFIP

API completa para facturación electrónica con AFIP basada en el Manual ARCA-COMPG v4.0.

## 📋 Índice

- [Endpoints Disponibles](#endpoints-disponibles)
- [Tipos de Comprobante](#tipos-de-comprobante)
- [Condiciones IVA del Receptor](#condiciones-iva-del-receptor)
- [Crear Factura](#crear-factura)
- [Notas de Crédito/Débito](#notas-de-créditodébito)
- [Facturas de Crédito Electrónica (MiPyME)](#facturas-de-crédito-electrónica-mipyme)
- [Código QR](#código-qr)
- [Errores Comunes](#errores-comunes)

---

## Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/afip/invoice` | Crear comprobante electrónico |
| POST | `/api/afip/ultimo-autorizado` | Consultar último comprobante |
| POST | `/api/afip/consultar-contribuyente` | Consultar datos de contribuyente |
| POST | `/api/afip/tipos-comprobante` | Listar tipos habilitados |
| POST | `/api/afip/puntos-venta` | Listar puntos de venta |
| POST | `/api/afip/condiciones-iva` | Listar condiciones IVA válidas |
| POST | `/api/afip/generar-qr` | Generar código QR |

---

## Tipos de Comprobante

### Facturas
| Código | Descripción | Emisor |
|--------|-------------|--------|
| 1 | Factura A | Resp. Inscripto → Resp. Inscripto |
| 6 | Factura B | Resp. Inscripto → Cons. Final/Exento |
| 11 | Factura C | Monotributista → Cualquiera |
| 51 | Factura M | Resp. Inscripto (con retención) |

### Notas de Crédito
| Código | Descripción |
|--------|-------------|
| 3 | Nota de Crédito A |
| 8 | Nota de Crédito B |
| 13 | Nota de Crédito C |

### Notas de Débito
| Código | Descripción |
|--------|-------------|
| 2 | Nota de Débito A |
| 7 | Nota de Débito B |
| 12 | Nota de Débito C |

### Facturas de Crédito Electrónica (MiPyME)
| Código | Descripción |
|--------|-------------|
| 201 | Factura de Crédito Electrónica A |
| 206 | Factura de Crédito Electrónica B |
| 211 | Factura de Crédito Electrónica C |
| 203 | Nota de Crédito FCE A |
| 208 | Nota de Crédito FCE B |
| 213 | Nota de Crédito FCE C |

---

## Condiciones IVA del Receptor

> ⚠️ **IMPORTANTE**: Desde el 01/02/2026 este campo es **OBLIGATORIO**.

### Por Clase de Comprobante

| Código | Descripción | Clase A/M | Clase B | Clase C |
|--------|-------------|:---------:|:-------:|:-------:|
| 1 | IVA Responsable Inscripto | ✅ | ❌ | ✅ |
| 4 | IVA Sujeto Exento | ❌ | ✅ | ✅ |
| 5 | Consumidor Final | ❌ | ✅ | ✅ |
| 6 | Responsable Monotributo | ✅ | ❌ | ✅ |
| 7 | Sujeto No Categorizado | ❌ | ✅ | ✅ |
| 8 | Proveedor del Exterior | ❌ | ✅ | ✅ |
| 9 | Cliente del Exterior | ❌ | ✅ | ✅ |
| 10 | IVA Liberado (Ley 19.640) | ❌ | ✅ | ✅ |
| 13 | Monotributista Social | ✅ | ❌ | ✅ |
| 15 | IVA No Alcanzado | ❌ | ✅ | ✅ |
| 16 | Monotributo Trab. Independiente | ✅ | ❌ | ✅ |

---

## Crear Factura

### Factura B - Consumidor Final

```bash
curl -X POST http://localhost:3002/api/afip/invoice \
  -H "Content-Type: application/json" \
  -d '{
    "puntoVenta": 1,
    "tipoComprobante": 6,
    "fechaComprobante": "20251205",
    "cuitCliente": "0",
    "tipoDocumento": 99,
    "condicionIvaReceptor": 5,
    "concepto": 1,
    "importeNetoGravado": 1000.00,
    "importeIva": 210.00,
    "importeTotal": 1210.00,
    "iva": [
      { "Id": 5, "BaseImp": 1000.00, "Importe": 210.00 }
    ],
    "monedaId": "PES",
    "cotizacionMoneda": 1,
    "cuitEmisor": "20123456789",
    "certificado": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
    "clavePrivada": "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
  }'
```

### Factura A - Responsable Inscripto

```bash
curl -X POST http://localhost:3002/api/afip/invoice \
  -H "Content-Type: application/json" \
  -d '{
    "puntoVenta": 1,
    "tipoComprobante": 1,
    "fechaComprobante": "20251205",
    "cuitCliente": "30123456789",
    "tipoDocumento": 80,
    "condicionIvaReceptor": 1,
    "concepto": 1,
    "importeNetoGravado": 10000.00,
    "importeIva": 2100.00,
    "importeTotal": 12100.00,
    "iva": [
      { "Id": 5, "BaseImp": 10000.00, "Importe": 2100.00 }
    ],
    "cuitEmisor": "20123456789",
    "certificado": "...",
    "clavePrivada": "..."
  }'
```

### Factura C - Monotributista

```bash
curl -X POST http://localhost:3002/api/afip/invoice \
  -H "Content-Type: application/json" \
  -d '{
    "puntoVenta": 2,
    "tipoComprobante": 11,
    "fechaComprobante": "20251205",
    "cuitCliente": "0",
    "tipoDocumento": 99,
    "condicionIvaReceptor": 5,
    "concepto": 1,
    "importeNetoGravado": 5000.00,
    "importeIva": 0,
    "importeTotal": 5000.00,
    "cuitEmisor": "27123456789",
    "certificado": "...",
    "clavePrivada": "..."
  }'
```

### Factura por Servicios (Concepto 2)

```bash
curl -X POST http://localhost:3002/api/afip/invoice \
  -H "Content-Type: application/json" \
  -d '{
    "puntoVenta": 1,
    "tipoComprobante": 6,
    "fechaComprobante": "20251205",
    "cuitCliente": "0",
    "tipoDocumento": 99,
    "condicionIvaReceptor": 5,
    "concepto": 2,
    "importeNetoGravado": 1000.00,
    "importeIva": 210.00,
    "importeTotal": 1210.00,
    "iva": [{ "Id": 5, "BaseImp": 1000.00, "Importe": 210.00 }],
    "fechaServicioDesde": "20251201",
    "fechaServicioHasta": "20251205",
    "fechaVencimientoPago": "20251215",
    "cuitEmisor": "20123456789",
    "certificado": "...",
    "clavePrivada": "..."
  }'
```

### Respuesta Exitosa

```json
{
  "data": {
    "cae": "71234567890123",
    "caeFchVto": "20251215",
    "puntoVenta": 1,
    "tipoComprobante": 6,
    "numeroComprobante": 1,
    "fechaComprobante": "20251205",
    "importeTotal": 1210.00,
    "resultado": "A",
    "codigoAutorizacion": "71234567890123",
    "cuitEmisor": "20123456789",
    "tipoDocReceptor": 99,
    "nroDocReceptor": "0",
    "qrData": {
      "ver": 1,
      "fecha": "2025-12-05",
      "cuit": "20123456789",
      "ptoVta": 1,
      "tipoCmp": 6,
      "nroCmp": 1,
      "importe": 1210.00,
      "moneda": "PES",
      "ctz": 1,
      "tipoDocRec": 99,
      "nroDocRec": "0",
      "tipoCodAut": "E",
      "codAut": "71234567890123",
      "url": "https://www.afip.gob.ar/fe/qr/?p=eyJ2ZXIiOjEsImZlY2hhIjoiMjAyNS0xMi0wNSIsImN1aXQiOjIwMTIzNDU2Nzg5Li4ufQ=="
    }
  },
  "success": true,
  "message": "Factura creada exitosamente",
  "timestamp": "2025-12-05T12:00:00.000Z"
}
```

---

## Notas de Crédito/Débito

Las notas de crédito y débito **requieren** referenciar el comprobante original.

### Nota de Crédito B

```bash
curl -X POST http://localhost:3002/api/afip/invoice \
  -H "Content-Type: application/json" \
  -d '{
    "puntoVenta": 1,
    "tipoComprobante": 8,
    "fechaComprobante": "20251205",
    "cuitCliente": "0",
    "tipoDocumento": 99,
    "condicionIvaReceptor": 5,
    "concepto": 1,
    "importeNetoGravado": 500.00,
    "importeIva": 105.00,
    "importeTotal": 605.00,
    "iva": [{ "Id": 5, "BaseImp": 500.00, "Importe": 105.00 }],
    "comprobantesAsociados": [
      {
        "Tipo": 6,
        "PtoVta": 1,
        "Nro": 1,
        "CbteFch": "20251201"
      }
    ],
    "cuitEmisor": "20123456789",
    "certificado": "...",
    "clavePrivada": "..."
  }'
```

---

## Facturas de Crédito Electrónica (MiPyME)

Para FCE se requiere incluir el CBU del emisor.

### FCE Tipo B

```bash
curl -X POST http://localhost:3002/api/afip/invoice \
  -H "Content-Type: application/json" \
  -d '{
    "puntoVenta": 1,
    "tipoComprobante": 206,
    "fechaComprobante": "20251205",
    "cuitCliente": "30123456789",
    "tipoDocumento": 80,
    "condicionIvaReceptor": 5,
    "concepto": 1,
    "importeNetoGravado": 50000.00,
    "importeIva": 10500.00,
    "importeTotal": 60500.00,
    "iva": [{ "Id": 5, "BaseImp": 50000.00, "Importe": 10500.00 }],
    "cbu": {
      "Cbu": "0110599940000064179016",
      "Alias": "MI.ALIAS.CBU"
    },
    "fceVtoPago": "20260105",
    "cuitEmisor": "20123456789",
    "certificado": "...",
    "clavePrivada": "..."
  }'
```

---

## Código QR

### Generar QR para comprobante existente

```bash
curl -X POST http://localhost:3002/api/afip/generar-qr \
  -H "Content-Type: application/json" \
  -d '{
    "cuit": "20123456789",
    "ptoVta": 1,
    "tipoCmp": 6,
    "nroCmp": 1,
    "fecha": "20251205",
    "importe": 1210.00,
    "moneda": "PES",
    "ctz": 1,
    "tipoDocRec": 99,
    "nroDocRec": "0",
    "cae": "71234567890123"
  }'
```

### Respuesta

```json
{
  "data": {
    "ver": 1,
    "fecha": "2025-12-05",
    "cuit": "20123456789",
    "ptoVta": 1,
    "tipoCmp": 6,
    "nroCmp": 1,
    "importe": 1210.00,
    "moneda": "PES",
    "ctz": 1,
    "tipoDocRec": 99,
    "nroDocRec": "0",
    "tipoCodAut": "E",
    "codAut": "71234567890123",
    "url": "https://www.afip.gob.ar/fe/qr/?p=..."
  },
  "success": true,
  "message": "Datos QR generados exitosamente"
}
```

---

## Alícuotas de IVA

| Id | Porcentaje | Descripción |
|----|------------|-------------|
| 1 | - | No Gravado |
| 2 | - | Exento |
| 3 | 0% | IVA 0% |
| 4 | 10.5% | IVA 10.5% |
| 5 | 21% | IVA 21% |
| 6 | 27% | IVA 27% |
| 8 | 5% | IVA 5% |
| 9 | 2.5% | IVA 2.5% |

---

## Consultar Parámetros

### Tipos de Comprobante Habilitados

```bash
curl -X POST http://localhost:3002/api/afip/tipos-comprobante \
  -H "Content-Type: application/json" \
  -d '{
    "cuitEmisor": "20123456789",
    "certificado": "...",
    "clavePrivada": "..."
  }'
```

### Puntos de Venta

```bash
curl -X POST http://localhost:3002/api/afip/puntos-venta \
  -H "Content-Type: application/json" \
  -d '{
    "cuitEmisor": "20123456789",
    "certificado": "...",
    "clavePrivada": "..."
  }'
```

### Condiciones IVA para Clase C

```bash
curl -X POST http://localhost:3002/api/afip/condiciones-iva \
  -H "Content-Type: application/json" \
  -d '{
    "cuitEmisor": "20123456789",
    "certificado": "...",
    "clavePrivada": "...",
    "claseComprobante": "C"
  }'
```

---

## Errores Comunes

### Error 10000 - No autorizado

```
NO AUTORIZADO A EMITIR COMPROBANTES - LA CUIT INFORMADA NO CORRESPONDE A RESPONSABLE MONOTRIBUTO
```

**Causa**: Intentas emitir Factura C pero el CUIT es de un Responsable Inscripto.  
**Solución**: Usa Factura B (tipo 6) en lugar de Factura C (tipo 11).

### Error 10016 - Número incorrecto

```
El número o fecha del comprobante no se corresponde con el próximo a autorizar
```

**Causa**: El número de comprobante no es el esperado.  
**Solución**: Usa el endpoint `/api/afip/ultimo-autorizado` para obtener el próximo número.

### Error 10049 - Fechas de servicio

```
FchServDesde Debe informarse solo si Concepto es igual a 2 o 3
```

**Causa**: Enviaste fechas de servicio para un comprobante de productos.  
**Solución**: Solo incluir `fechaServicioDesde/Hasta/VtoPago` si `concepto = 2` o `concepto = 3`.

### Error 10048 - IVA inválido

```
El importe del campo ImpIVA no es igual a la suma de los importes del array Iva
```

**Causa**: El array de IVA no coincide con el total.  
**Solución**: Asegurar que la suma de `Importe` en el array `iva` sea igual a `importeIva`.

### Error 10017 - Condición IVA inválida

```
La condición de IVA del receptor no es válida para el tipo de comprobante
```

**Causa**: La condición IVA no es válida para la clase de comprobante.  
**Solución**: Ver tabla de [Condiciones IVA por Clase](#por-clase-de-comprobante).

---

## Referencias

- [Manual ARCA-COMPG v4.0](https://www.afip.gob.ar/fe/)
- [Especificaciones QR RG 4291](https://www.afip.gob.ar/fe/qr/especificaciones.asp)
- [WSFE - Web Service Factura Electrónica](https://wswhomo.afip.gov.ar/wsfev1/service.asmx)

