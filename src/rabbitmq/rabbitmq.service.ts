import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, ChannelModel, ConfirmChannel } from 'amqplib';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: ChannelModel | null = null;
  private channel: ConfirmChannel | null = null;
  private readonly exchangeName = 'pistech-exchange';
  private readonly queueName: string;
  private readonly rabbitmqUrl: string;
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: number;
  private readonly allowedOrigins: string[];

  private readonly patterns = ['send-email'];
  /** true mientras la app se apaga: ese cierre no es una falla. */
  private apagando = false;
  /** Conexión en curso: dos envíos simultáneos comparten la misma. */
  private conectando: Promise<void> | null = null;

  constructor(private configService: ConfigService) {
    this.queueName = this.configService.get<string>('RABBITMQ_QUEUE') || 'pistech-automation';
    this.rabbitmqUrl = this.configService.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672';
    this.jwtSecret = this.configService.get<string>('RABBITMQ_JWT_SECRET') || '';
    if (!this.jwtSecret) {
      this.logger.warn('RABBITMQ_JWT_SECRET no configurado. Los mensajes RabbitMQ fallarán.');
    }
    const expiresInStr = this.configService.get<string>('RABBITMQ_JWT_EXPIRES_IN') || '180';
    this.jwtExpiresIn = this.parseExpiresIn(expiresInStr);
    this.allowedOrigins = (this.configService.get<string>('ALLOWED_ORIGINS') || '').split(',').filter(Boolean);
  }

  private parseExpiresIn(expiresIn: string): number {
    const trimmed = expiresIn.trim().toLowerCase();
    if (/^\d+$/.test(trimmed)) {
      return parseInt(trimmed, 10);
    }
    if (trimmed.endsWith('s')) {
      return parseInt(trimmed.slice(0, -1), 10);
    }
    if (trimmed.endsWith('m')) {
      return parseInt(trimmed.slice(0, -1), 10) * 60;
    }
    if (trimmed.endsWith('h')) {
      return parseInt(trimmed.slice(0, -1), 10) * 3600;
    }
    const parsed = parseInt(trimmed, 10);
    return isNaN(parsed) ? 180 : parsed;
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.connect();
    } catch (error) {
      this.logger.error('Error al conectar con RabbitMQ:', error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.apagando = true;
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      const connection = await connect(this.rabbitmqUrl);
      const channel = await connection.createConfirmChannel();

      // Sin estos listeners, si RabbitMQ se reinicia o corta la conexión,
      // amqplib emite 'error' sin nadie que lo escuche y Node mata el
      // proceso: el backend queda caído hasta que alguien lo reinicia. Con
      // ellos se registra, se suelta la conexión y el próximo envío
      // reconecta solo (ensureConnection).
      connection.on('error', (err) => this.logger.error('Conexión con RabbitMQ con error:', err));
      connection.on('close', () => this.soltar(connection, 'conexión'));
      channel.on('error', (err) => this.logger.error('Canal de RabbitMQ con error:', err));
      channel.on('close', () => {
        if (this.channel === channel) this.channel = null;
      });

      this.connection = connection;
      this.channel = channel;

      await this.channel.assertExchange(this.exchangeName, 'direct', { durable: true });
      await this.channel.assertQueue(this.queueName, { durable: true });

      for (const pattern of this.patterns) {
        await this.channel.bindQueue(this.queueName, this.exchangeName, pattern);
      }

      this.logger.log(`Conectado a RabbitMQ. Exchange: ${this.exchangeName}, Cola: ${this.queueName}`);
    } catch (error) {
      this.logger.error('Error al conectar con RabbitMQ:', error);
      this.connection = null;
      this.channel = null;
      throw error;
    }
  }

  private soltar(connection: ChannelModel, que: string): void {
    if (this.connection !== connection) return;
    this.connection = null;
    this.channel = null;
    if (!this.apagando) {
      this.logger.warn(`Se cerró la ${que} con RabbitMQ; se reconecta en el próximo envío.`);
    }
  }

  private async ensureConnection(): Promise<void> {
    if (this.connection && this.channel) return;
    this.conectando ??= this.connect().finally(() => {
      this.conectando = null;
    });
    await this.conectando;
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      this.logger.log('Desconectado de RabbitMQ');
    } catch (error) {
      this.logger.error('Error al desconectar de RabbitMQ:', error);
    }
  }

  private generateJWT(): string {
    if (!this.jwtSecret) {
      throw new Error('RABBITMQ_JWT_SECRET no configurado.');
    }

    const now = Math.floor(Date.now() / 1000);

    return jwt.sign(
      {
        sub: 'rabbitmq-gioia-expreso',
        iat: now,
        exp: now + this.jwtExpiresIn,
        jti: `rabbitmq-${now}-${Math.random().toString(36).substring(7)}`,
      },
      this.jwtSecret,
      { issuer: 'gioia-expreso-backend' },
    );
  }

  async sendMessage(pattern: string, data: Record<string, unknown>, origin?: string): Promise<boolean> {
    try {
      await this.ensureConnection();

      if (!this.channel) {
        throw new Error('Canal de RabbitMQ no disponible');
      }

      const token = this.generateJWT();

      const messageHeaders = {
        authorization: `Bearer ${token}`,
        origin: origin || this.allowedOrigins[0] || 'https://api.gioia-expreso.com',
      };

      const messageBody = {
        pattern,
        data: {
          ...data,
          token,
          headers: { authorization: `Bearer ${token}` },
        },
        jwt: token,
      };

      const published = this.channel.publish(
        this.exchangeName,
        pattern,
        Buffer.from(JSON.stringify(messageBody)),
        { persistent: true, headers: messageHeaders },
      );

      if (!published) {
        this.logger.warn(`Buffer lleno, mensaje no publicado: ${pattern}`);
        return false;
      }

      await this.channel.waitForConfirms();
      this.logger.log(`Mensaje confirmado en RabbitMQ: ${pattern}`);
      return true;
    } catch (error) {
      this.logger.error(`Error al enviar mensaje a RabbitMQ (${pattern}):`, error);
      // Se cierra antes de soltarla: si no, el socket y su heartbeat quedan
      // vivos y el próximo envío abre otra conexión encima.
      const vieja = this.connection;
      this.channel = null;
      this.connection = null;
      await vieja?.close().catch(() => undefined);
      return false;
    }
  }
}
