import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, catchError } from 'rxjs';
import { AxiosError } from 'axios';
import { CalculatorAuthService } from './calculator-auth.service';

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
  ) {
    this.apiUrl = this.configService.get<string>('calculator.apiUrl') || 'https://api.credifin.com.ar';
    this.priceReductionPercentage = this.configService.get<number>('calculator.priceReduction') || 0;
  }

  /**
   * Busca localidades
   */
  async searchLocalidades(query: string, atendida: number = 1): Promise<any> {
    const url = `${this.apiUrl}/api/localidades`;
    const params = {
      web: 'true',
      q: query,
      atendida: atendida.toString(),
    };

    return this.makeRequest('GET', url, null, params);
  }

  /**
   * Obtiene cotización con reducción de precios aplicada
   */
  async cotizar(payload: {
    acuerdos_id: number;
    articulos_id: number;
    opostal: string;
    dpostal: string;
    bultos: Array<{
      cantidad: number;
      peso: number;
      x: number;
      y: number;
      z: number;
      valor_declarado: number;
    }>;
  }): Promise<any> {
    const url = `${this.apiUrl}/api/cotizar`;
    const result = await this.makeRequest('POST', url, payload);

    // Aplicar reducción de precios si está configurada
    if (this.priceReductionPercentage > 0 && result?.cotizacion_web) {
      return {
        ...result,
        cotizacion_web: this.applyPriceReduction(result.cotizacion_web),
      };
    }

    return result;
  }

  /**
   * Aplica reducción de porcentaje a flete, precio y precio_final
   */
  private applyPriceReduction(cotizaciones: CotizacionItem[]): CotizacionItem[] {
    const reductionMultiplier = 1 - (this.priceReductionPercentage / 100);

    return cotizaciones.map(cotizacion => ({
      ...cotizacion,
      flete: Math.round(cotizacion.flete * reductionMultiplier * 100) / 100,
      precio: Math.round(cotizacion.precio * reductionMultiplier * 100) / 100,
      precio_final: Math.round(cotizacion.precio_final * reductionMultiplier * 100) / 100,
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
    retryCount = 0,
  ): Promise<any> {
    try {
      const token = await this.authService.getToken();
      const headers: Record<string, string> = {
        'Authorization': `${token.includes('Bearer') ? token : `Bearer ${token}`}`,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'es-ES,es;q=0.9',
        'Referer': 'https://credifin.com.ar/',
        'Origin': 'https://credifin.com.ar',
        'Sec-CH-UA': '"Not_A Brand";v="99", "Chromium";v="142"',
        'Sec-CH-UA-Mobile': '?0',
        'Sec-CH-UA-Platform': '"Linux"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
      };

      // Agregar Content-Type solo para POST
      if (method === 'POST') {
        headers['Content-Type'] = 'application/json';
      }

      const config = {
        headers,
        params,
      };

      this.logger.debug(`${method} ${url}${params ? '?' + new URLSearchParams(params).toString() : ''}`);
      this.logger.debug(`Token usado: ${token.substring(0, 20)}...`);

      const response = await firstValueFrom(
        method === 'GET'
          ? this.httpService.get(url, config)
          : this.httpService.post(url, body, config),
      );

      // Extraer solo el data de la respuesta de la API externa
      // para evitar anidación con el ResponseInterceptor
      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        return response.data.data;
      }

      return response.data;
    } catch (error: any) {
      const axiosError = error as AxiosError;

      // Si recibimos 401 y aún no hemos reintentado, invalidar token y reintentar
      if (axiosError.response?.status === 401 && retryCount === 0) {
        this.logger.warn('Token expirado o inválido, obteniendo nuevo token y reintentando...');
        this.logger.warn(`Error detallado: ${JSON.stringify(axiosError.response.data)}`);
        this.authService.invalidateToken();
        // Esperar un momento antes de reintentar para evitar problemas de timing
        await new Promise(resolve => setTimeout(resolve, 500));
        return this.makeRequest(method, url, body, params, retryCount + 1);
      }

      // Si es un error HTTP, lanzar excepción con el mensaje apropiado
      if (axiosError.response) {
        const status = axiosError.response.status;
        const statusText = axiosError.response.statusText;
        const data = axiosError.response.data as any;

        this.logger.error(`Error ${status} en ${method} ${url}: ${JSON.stringify(data)}`);

        const errorMessage = (data && typeof data === 'object' && 'message' in data)
          ? data.message
          : `Error al comunicarse con API externa: ${statusText}`;

        throw new HttpException(errorMessage, status);
      }

      // Error de red u otro error
      this.logger.error(`Error de red en ${method} ${url}: ${error.message}`, error.stack);
      throw new HttpException(
        'Error al comunicarse con la API externa',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

