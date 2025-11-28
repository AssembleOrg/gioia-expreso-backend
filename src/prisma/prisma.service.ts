import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor(private configService: ConfigService) {
    const databaseUrl = configService.get<string>('database.url') || process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined');
    }

    // Create a connection pool
    const pool = new Pool({
      connectionString: databaseUrl,
    });

    // Create the adapter
    const adapter = new PrismaPg(pool);

    // Initialize PrismaClient with the adapter
    super({ adapter });

    // Assign pool to instance after super()
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}

