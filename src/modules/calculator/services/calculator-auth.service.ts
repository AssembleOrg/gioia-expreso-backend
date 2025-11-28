import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface TokenCache {
  token: string;
  expiresAt: number;
}

@Injectable()
export class CalculatorAuthService {
  private readonly logger = new Logger(CalculatorAuthService.name);
  private tokenCache: TokenCache | null = null;
  private readonly authUrl: string;
  private readonly TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutos antes de expirar

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.authUrl = this.configService.get<string>('calculator.authUrl') || 'https://auth.credifin.com.ar/v1/token';
  }

  /**
   * Obtiene un token válido, usando caché si está disponible y no expirado
   */
  async getToken(): Promise<string> {
    // Verificar si tenemos un token válido en caché
    if (this.tokenCache && this.isTokenValid()) {
      this.logger.debug('Usando token en caché');
      return this.tokenCache.token;
    }

    // Obtener nuevo token
    this.logger.log('Obteniendo nuevo token de autenticación');
    return await this.fetchNewToken();
  }

  /**
   * Obtiene un nuevo token de la API de autenticación
   */
  private async fetchNewToken(): Promise<string> {
    try {
      this.logger.debug(`Solicitando token desde: ${this.authUrl}`);
      
      const response = await firstValueFrom(
        this.httpService.get<any>(this.authUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
        }),
      );

      this.logger.debug(`Respuesta de autenticación: ${JSON.stringify(response.data)}`);

      // Intentar obtener el token de diferentes posibles campos
      const token = 
        response.data?.token || 
        response.data?.access_token || 
        response.data?.data?.token ||
        response.data?.data?.access_token ||
        (typeof response.data === 'string' ? response.data : null);

      if (!token || typeof token !== 'string') {
        this.logger.error(`No se recibió token válido en la respuesta. Respuesta completa: ${JSON.stringify(response.data)}`);
        throw new HttpException('Error al obtener token de autenticación', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      // Guardar token en caché con expiración de 3 horas (menos buffer)
      const expiresAt = Date.now() + 3 * 60 * 60 * 1000 - this.TOKEN_EXPIRY_BUFFER;
      this.tokenCache = {
        token,
        expiresAt,
      };

      this.logger.log(`Token obtenido exitosamente (${token.substring(0, 20)}...), expira en ${new Date(expiresAt).toISOString()}`);
      return token;
    } catch (error: any) {
      this.logger.error(`Error al obtener token: ${error.message}`, error.stack);
      
      if (error.response) {
        this.logger.error(`Respuesta de error: ${JSON.stringify(error.response.data)}`);
        throw new HttpException(
          `Error al autenticar con API externa: ${error.response.status} ${error.response.statusText}`,
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      throw new HttpException('Error al obtener token de autenticación', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Verifica si el token en caché es válido
   */
  private isTokenValid(): boolean {
    if (!this.tokenCache) {
      return false;
    }

    return Date.now() < this.tokenCache.expiresAt;
  }

  /**
   * Invalida el token en caché (útil para forzar renovación)
   */
  invalidateToken(): void {
    this.logger.log('Invalidando token en caché');
    this.tokenCache = null;
  }
}

