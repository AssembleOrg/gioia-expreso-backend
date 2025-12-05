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

  // ==================== ADMIN USERS ====================
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

  // ==================== PACKAGE TYPES ====================
  const packageTypes = [
    {
      name: 'Bulto',
      type: 'BULTO' as const,
      height: 0,
      width: 0,
      depth: 0,
      weight: 0,
      imageUrl: '/public/packages/bulto.png',
      isCustom: true,
    },
    {
      name: 'Bolsa 20x32',
      type: 'BAG_20X32' as const,
      height: 32,
      width: 20,
      depth: 10,
      weight: 2,
      imageUrl: '/public/packages/bag-20x32.png',
      isCustom: false,
    },
    {
      name: 'Bolsa 30x41',
      type: 'BAG_30X41' as const,
      height: 41,
      width: 30,
      depth: 15,
      weight: 5,
      imageUrl: '/public/packages/bag-30x41.png',
      isCustom: false,
    },
    {
      name: 'Bolsa 42x54',
      type: 'BAG_42X54' as const,
      height: 54,
      width: 42,
      depth: 20,
      weight: 10,
      imageUrl: '/public/packages/bag-42x54.png',
      isCustom: false,
    },
    {
      name: 'Bolsa 70x80',
      type: 'BAG_70X80' as const,
      height: 80,
      width: 70,
      depth: 30,
      weight: 20,
      imageUrl: '/public/packages/bag-70x80.png',
      isCustom: false,
    },
  ];

  for (const pkgType of packageTypes) {
    const existing = await prisma.packageType.findUnique({
      where: { type: pkgType.type },
    });

    if (existing) {
      console.log(`⚠️  Tipo de paquete ${pkgType.name} ya existe, actualizando...`);
      await prisma.packageType.update({
        where: { type: pkgType.type },
        data: pkgType,
      });
    } else {
      await prisma.packageType.create({ data: pkgType });
      console.log(`✅ Tipo de paquete ${pkgType.name} creado`);
    }
  }

  console.log('✨ Seed completado!');

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error('❌ Error en seed:', e);
  process.exit(1);
});
