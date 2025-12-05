import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@prisma';
import { CreateTransportDto, UpdateTransportDto, FilterTransportDto } from '../dto';

@Injectable()
export class TransportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear un nuevo transporte
   */
  async create(dto: CreateTransportDto) {
    // Verificar que la patente no exista
    const existing = await this.prisma.transport.findUnique({
      where: { licensePlate: dto.licensePlate.toUpperCase() },
    });

    if (existing) {
      throw new ConflictException(`Ya existe un transporte con la patente ${dto.licensePlate}`);
    }

    return this.prisma.transport.create({
      data: {
        name: dto.name,
        licensePlate: dto.licensePlate.toUpperCase(),
        available: dto.available ?? true,
      },
    });
  }

  /**
   * Obtener todos los transportes sin paginación
   */
  async findAll(filters: FilterTransportDto) {
    const where = this.buildWhereClause(filters);
    
    return this.prisma.transport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { containers: true },
        },
      },
    });
  }

  /**
   * Obtener transportes con paginación
   */
  async findAllPaginated(filters: FilterTransportDto) {
    const where = this.buildWhereClause(filters);
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.transport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { containers: true },
          },
        },
      }),
      this.prisma.transport.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Obtener un transporte por ID
   */
  async findOne(id: string) {
    const transport = await this.prisma.transport.findFirst({
      where: { 
        id,
        deletedAt: null,
      },
      include: {
        containers: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!transport) {
      throw new NotFoundException(`Transporte con ID ${id} no encontrado`);
    }

    return transport;
  }

  /**
   * Actualizar un transporte
   */
  async update(id: string, dto: UpdateTransportDto) {
    await this.findOne(id);

    // Si se actualiza la patente, verificar que no exista
    if (dto.licensePlate) {
      const existing = await this.prisma.transport.findFirst({
        where: {
          licensePlate: dto.licensePlate.toUpperCase(),
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existing) {
        throw new ConflictException(`Ya existe un transporte con la patente ${dto.licensePlate}`);
      }
    }

    return this.prisma.transport.update({
      where: { id },
      data: {
        ...dto,
        licensePlate: dto.licensePlate?.toUpperCase(),
      },
    });
  }

  /**
   * Eliminar un transporte (soft delete)
   */
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.transport.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Restaurar un transporte eliminado
   */
  async restore(id: string) {
    const transport = await this.prisma.transport.findFirst({
      where: { id, deletedAt: { not: null } },
    });

    if (!transport) {
      throw new NotFoundException(`Transporte eliminado con ID ${id} no encontrado`);
    }

    return this.prisma.transport.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  /**
   * Construir cláusula WHERE con filtros parciales
   */
  private buildWhereClause(filters: FilterTransportDto) {
    const where: any = {
      deletedAt: null,
    };

    if (filters.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive',
      };
    }

    if (filters.licensePlate) {
      where.licensePlate = {
        contains: filters.licensePlate.toUpperCase(),
        mode: 'insensitive',
      };
    }

    if (filters.available !== undefined) {
      where.available = filters.available;
    }

    return where;
  }
}

