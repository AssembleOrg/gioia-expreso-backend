export interface EnvConfig {
  nodeEnv: string;
  port: number;
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  swagger: {
    enabled: boolean;
    password?: string;
  };
  rabbitmq: {
    url: string;
    queue: string;
    jwtSecret: string;
    jwtExpiresIn: string;
  };
  frontend: {
    url: string;
  };
  calculator: {
    authUrl: string;
    apiUrl: string;
    priceReduction: number;
  };
  afip: {
    production: boolean;
    apiUrl: string;
  };
}

export default (): EnvConfig => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true',
    password: process.env.SWAGGER_PASSWORD,
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    queue: process.env.RABBITMQ_QUEUE || 'pistech-automation',
    jwtSecret: process.env.RABBITMQ_JWT_SECRET || '',
    jwtExpiresIn: process.env.RABBITMQ_JWT_EXPIRES_IN || '180',
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  calculator: {
    authUrl: process.env.CALCULATOR_AUTH_URL || 'https://auth.credifin.com.ar/v1/token',
    apiUrl: process.env.CALCULATOR_API_URL || 'https://api.credifin.com.ar',
    priceReduction: parseFloat(process.env.CALCULATOR_PRICE_REDUCTION || '0'),
  },
  afip: {
    production: process.env.AFIP_PRODUCTION === 'true',
    apiUrl: process.env.AFIP_API_URL || 'https://api.afip.gob.ar',
  },
});

