import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { CalculatorAuthService } from './calculator-auth.service';
import { ShippingQuoteService } from './shipping-quote.service';

interface CotizacionItem {
  id: number;
  descripcion: string;
  precio: number;
  precio_final: number;
  flete: number;
  seguro: number;
}

@Injectable()
export class CalculatorService {
  private readonly logger = new Logger(CalculatorService.name);
  private readonly apiUrl: string;
  private readonly priceReductionPercentage: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly authService: CalculatorAuthService,
    private readonly shippingQuoteService: ShippingQuoteService,
  ) {
    this.apiUrl =
      this.configService.get<string>('calculator.apiUrl') ||
      'https://api.credifin.com.ar';
    this.priceReductionPercentage =
      this.configService.get<number>('calculator.priceReduction') || 0;
  }

  /**
   * Busca localidades
   */
  async searchLocalidades(query: string, cobertura: number = 1): Promise<any> {
    const url = `${this.apiUrl}/public/localidades`;
    const params = {
      q: query,
      cobertura: cobertura.toString(),
    };

    return this.makeRequest('GET', url, null, params);
  }

  /**
   * Obtiene información de una filial por ID
   */
  async getFilial(id: number): Promise<any> {
    const url = `${this.apiUrl}/public/filiales/${id}`;
    return this.makeRequest('GET', url, null);
  }

  /**
   * Obtiene cotización con reducción de precios aplicada
   */
  async cotizar(payload: {
    cotizacion: Array<{
      ofiliales_id: number;
      dfiliales_id: number;
      localidades_id: number;
      articulos_id: number;
      precios_id: number;
      peso?: number;
      x?: number;
      y?: number;
      z?: number;
      volumen?: number;
      cantidad?: number;
      valor_declarado: number;
      remitentes_id?: number;
    }>;
  }): Promise<any> {
    const url = `${this.apiUrl}/public/cotizacion`;

    try {
      const credifinResponse = await this.makeRequest('POST', url, payload);
    // Verificar si la respuesta indica un error
    if (credifinResponse?.success === false || credifinResponse?.status === 'error') {
      const errorMessage =
        credifinResponse?.message || 'Error al obtener la cotización';
      this.logger.error(`Error en cotización de Credifin: ${errorMessage}`);
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    }

    // Verificar que tenemos datos válidos
    if (!credifinResponse?.data || !Array.isArray(credifinResponse.data)) {
      this.logger.error(
        'Respuesta de Credifin sin datos válidos',
        JSON.stringify(credifinResponse),
      );
      throw new HttpException(
        'La respuesta de la API no contiene datos válidos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Mapear la respuesta de Credifin al formato esperado por ShippingQuoteService
    // Manejar valores NULL correctamente
    const mappedResponse = {
      data: credifinResponse.data.map((item: any) => {
        const precio = item.precio != null ? Number(item.precio) : 0;

        return {
          precio: precio,
          adicional_retiro: item.adicional_retiro?.map((adicional: any) => ({
            retiro: adicional.retiro != null ? Number(adicional.retiro) : 0,
          })),
          adicional_entrega: item.adicional_entrega?.map((adicional: any) => ({
            entrega: adicional.entrega != null ? Number(adicional.entrega) : 0,
          })),
        };
      }),
    };

    // Validar que al menos un item tenga precio válido
    const hasValidPrice = mappedResponse.data.some((item) => item.precio > 0);
    if (!hasValidPrice) {
      this.logger.warn(
        'No se encontraron precios válidos en la respuesta de Credifin',
      );
      throw new HttpException(
        'No se pudo obtener un precio válido para la cotización',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Calcular los precios para los 4 modos con descuento aplicado
    const discountPct = this.priceReductionPercentage / 100;
    const precios = this.shippingQuoteService.calcAllModesWithDiscount(
      mappedResponse,
      discountPct,
    );

    // Devolver solo los datos, el ResponseInterceptor se encargará del formato estándar
    const result = {
      precios,
    };

    return result;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Aplica reducción de porcentaje a flete, precio y precio_final
   */
  private applyPriceReduction(
    cotizaciones: CotizacionItem[],
  ): CotizacionItem[] {
    const reductionMultiplier = 1 - this.priceReductionPercentage / 100;

    return cotizaciones.map((cotizacion) => ({
      ...cotizacion,
      flete: Math.round(cotizacion.flete * reductionMultiplier * 100) / 100,
      precio: Math.round(cotizacion.precio * reductionMultiplier * 100) / 100,
      precio_final:
        Math.round(cotizacion.precio_final * reductionMultiplier * 100) / 100,
    }));
  }

  /**
   * Realiza una petición a la API externa con manejo de autenticación y reintentos
   */
  private async makeRequest(
    method: 'GET' | 'POST',
    url: string,
    body?: any,
    params?: Record<string, string>,
  ): Promise<any> {
    try {
      // TEMPORALMENTE DESACTIVADO: No solicitar ni usar token de Credifin
      // const token = await this.authService.getToken();
      const headers: Record<string, string> = {
        // TEMPORALMENTE DESACTIVADO: No incluir Authorization header
        // 'Authorization': `${token.includes('Bearer') ? token : `Bearer ${token}`}`,
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'es-ES,es;q=0.9',
        Referer: 'https://credifin.com.ar/',
        Origin: 'https://credifin.com.ar',
        'Sec-CH-UA': '"Not_A Brand";v="99", "Chromium";v="142"',
        'Sec-CH-UA-Mobile': '?0',
        'Sec-CH-UA-Platform': '"Linux"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
      };

      // Agregar Content-Type solo para POST
      if (method === 'POST') {
        headers['Content-Type'] = 'application/json';
      }

      const config = {
        headers,
        params,
      };

      this.logger.debug(
        `${method} ${url}${params ? '?' + new URLSearchParams(params).toString() : ''}`,
      );
      // TEMPORALMENTE DESACTIVADO: No loggear token
      // this.logger.debug(`Token usado: ${token.substring(0, 20)}...`);

      const response = await firstValueFrom(
        method === 'GET'
          ? this.httpService.get(url, config)
          : this.httpService.post(url, body, config),
      );
      // Para el endpoint de cotización, necesitamos la respuesta completa para verificar success
      // Para otros endpoints, extraer solo el data
      if (url.includes('/public/cotizacion')) {
        return response.data;
      }

      // Extraer solo el data de la respuesta de la API externa
      // para evitar anidación con el ResponseInterceptor
      if (
        response.data &&
        typeof response.data === 'object' &&
        'data' in response.data
      ) {
        return response.data.data;
      }

      return response.data;
    } catch (error: any) {
      const axiosError = error as AxiosError;

      // TEMPORALMENTE DESACTIVADO: No manejar 401 con renovación de token
      // Si recibimos 401 y aún no hemos reintentado, invalidar token y reintentar
      // if (axiosError.response?.status === 401 && retryCount === 0) {
      //   this.logger.warn('Token expirado o inválido, obteniendo nuevo token y reintentando...');
      //   this.logger.warn(`Error detallado: ${JSON.stringify(axiosError.response.data)}`);
      //   this.authService.invalidateToken();
      //   // Esperar un momento antes de reintentar para evitar problemas de timing
      //   await new Promise(resolve => setTimeout(resolve, 500));
      //   return this.makeRequest(method, url, body, params, retryCount + 1);
      // }

      // Si es un error HTTP, lanzar excepción con el mensaje apropiado
      if (axiosError.response) {
        const status = axiosError.response.status;
        const statusText = axiosError.response.statusText;
        const data = axiosError.response.data as any;

        this.logger.error(
          `Error ${status} en ${method} ${url}: ${JSON.stringify(data)}`,
        );

        // Extraer mensaje de error de diferentes formatos posibles
        let errorMessage = `Error al comunicarse con API externa: ${statusText}`;

        if (data && typeof data === 'object') {
          // Formato: { message: "..." }
          if ('message' in data && data.message) {
            errorMessage = data.message;
          }
          // Formato: { status: "error", message: "..." }
          else if (
            'status' in data &&
            data.status === 'error' &&
            'message' in data
          ) {
            errorMessage = data.message;
          }
          // Formato: { error: "..." }
          else if ('error' in data && data.error) {
            errorMessage =
              typeof data.error === 'string'
                ? data.error
                : JSON.stringify(data.error);
          }
        }

        throw new HttpException(errorMessage, status);
      }

      // Error de red u otro error
      this.logger.error(
        `Error de red en ${method} ${url}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Error al comunicarse con la API externa',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
