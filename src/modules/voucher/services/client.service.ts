import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@prisma';
import { CreateClientDto, UpdateClientDto } from '../dto';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createClientDto: CreateClientDto) {
    const existingClient = await this.prisma.client.findUnique({
      where: { email: createClientDto.email },
    });

    if (existingClient) {
      throw new ConflictException('Ya existe un cliente con este email');
    }

    return this.prisma.client.create({
      data: createClientDto,
    });
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { preorders: true },
          },
        },
      }),
      this.prisma.client.count({ where: { deletedAt: null } }),
    ]);

    return {
      data: clients,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id, deletedAt: null },
      include: {
        preorders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return client;
  }

  async findByEmail(email: string) {
    return this.prisma.client.findUnique({
      where: { email, deletedAt: null },
    });
  }

  async update(id: string, updateClientDto: UpdateClientDto) {
    await this.findOne(id);

    if (updateClientDto.email) {
      const existingClient = await this.prisma.client.findFirst({
        where: {
          email: updateClientDto.email,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existingClient) {
        throw new ConflictException('Ya existe otro cliente con este email');
      }
    }

    return this.prisma.client.update({
      where: { id },
      data: updateClientDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async incrementVoucherCount(clientId: string) {
    return this.prisma.client.update({
      where: { id: clientId },
      data: {
        quantityVouchers: { increment: 1 },
      },
    });
  }
}

