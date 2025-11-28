import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined');
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('🌱 Iniciando seed...');

  const adminUsers = [
    {
      email: 'admin@example.com',
      password: 'Admin123!',
      fullname: 'Administrador Principal',
      role: 'ADMIN' as const,
    },
    {
      email: 'subadmin@example.com',
      password: 'SubAdmin123!',
      fullname: 'Sub Administrador',
      role: 'SUBADMIN' as const,
    },
  ];

  for (const adminUser of adminUsers) {
    const existingUser = await prisma.user.findUnique({
      where: { email: adminUser.email },
    });

    if (existingUser) {
      console.log(`⚠️  Usuario ${adminUser.email} ya existe, omitiendo...`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(adminUser.password, BCRYPT_ROUNDS);

    await prisma.user.create({
      data: {
        email: adminUser.email,
        password: hashedPassword,
        fullname: adminUser.fullname,
        role: adminUser.role,
        emailVerified: true,
      },
    });

    console.log(`✅ Usuario ${adminUser.email} creado con rol ${adminUser.role}`);
  }

  console.log('✨ Seed completado!');

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error('❌ Error en seed:', e);
  process.exit(1);
});
