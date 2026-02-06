import { Injectable } from '@nestjs/common';

type Adicional = { retiro?: number; entrega?: number };

type QuoteItem = {
  precio: number; // base sucursal-sucursal
  adicional_retiro?: Array<{ retiro: number }>;
  adicional_entrega?: Array<{ entrega: number }>;
};

type QuoteApiResponse = { data: QuoteItem[] };

type Mode = 'SUC_SUC' | 'SUC_DOM' | 'DOM_SUC' | 'DOM_DOM';

@Injectable()
export class ShippingQuoteService {
  private toCents(value: number): number {
    // Redondea a centavos por seguridad ante floats
    return Math.round(value * 100);
  }

  private fromCents(cents: number): number {
    return cents / 100;
  }

  private applyDiscountCents(totalCents: number, discountPct: number): number {
    // discountPct: 0.15 => 15%
    const factor = 1 - discountPct;
    return Math.round(totalCents * factor); // redondeo al centavo
  }

  /**
   * Calcula el total para un modo (retiro/entrega) y le aplica descuento.
   * Si hay múltiples items en response.data, suma todos (base y adicionales).
   */
  calcTotalWithDiscount(
    response: QuoteApiResponse,
    mode: Mode,
    discountPct = 0.15,
  ): number {
    const isRetiroDomicilio = mode === 'DOM_SUC' || mode === 'DOM_DOM';
    const isEntregaDomicilio = mode === 'SUC_DOM' || mode === 'DOM_DOM';

    let totalCents = 0;

    for (const item of response.data ?? []) {
      const baseCents = this.toCents(item.precio ?? 0);

      const retiroCents = this.toCents(item.adicional_retiro?.[0]?.retiro ?? 0);
      const entregaCents = this.toCents(item.adicional_entrega?.[0]?.entrega ?? 0);

      totalCents += baseCents;
      if (isRetiroDomicilio) totalCents += retiroCents;
      if (isEntregaDomicilio) totalCents += entregaCents;
    }

    const discountedCents = this.applyDiscountCents(totalCents, discountPct);
    return this.fromCents(discountedCents);
  }

  /**
   * Devuelve los 4 precios con el descuento aplicado.
   */
  calcAllModesWithDiscount(response: QuoteApiResponse, discountPct = 0.15) {
    return {
      SUC_SUC: this.calcTotalWithDiscount(response, 'SUC_SUC', discountPct),
      SUC_DOM: this.calcTotalWithDiscount(response, 'SUC_DOM', discountPct),
      DOM_SUC: this.calcTotalWithDiscount(response, 'DOM_SUC', discountPct),
      DOM_DOM: this.calcTotalWithDiscount(response, 'DOM_DOM', discountPct),
    };
  }
}
