import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@prisma';
import { CreateContainerDto, UpdateContainerDto, FilterContainerDto, AddPreordersDto } from '../dto';
import { ContainerStatus } from '@prisma/client';

@Injectable()
export class ContainerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generar código único de contenedor
   */
  private async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.container.count({
      where: {
        code: {
          startsWith: `CONT-${year}`,
        },
      },
    });
    return `CONT-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  /**
   * Crear un nuevo contenedor
   */
  async create(dto: CreateContainerDto) {
    // Verificar transporte si se proporciona
    if (dto.transportId) {
      const transport = await this.prisma.transport.findFirst({
        where: { id: dto.transportId, deletedAt: null },
      });
      if (!transport) {
        throw new NotFoundException(`Transporte con ID ${dto.transportId} no encontrado`);
      }
    }

    // Generar código si no se proporciona
    const code = dto.code || await this.generateCode();

    // Verificar que el código no exista
    const existing = await this.prisma.container.findUnique({
      where: { code },
    });
    if (existing) {
      throw new ConflictException(`Ya existe un contenedor con el código ${code}`);
    }

    // Crear contenedor
    const container = await this.prisma.container.create({
      data: {
        code,
        transportId: dto.transportId,
        status: (dto.status as ContainerStatus) || 'ON_LOAD',
        origin: dto.origin,
        destination: dto.destination,
        notes: dto.notes,
      },
      include: {
        transport: true,
      },
    });

    // Agregar preórdenes si se proporcionan
    if (dto.preorderIds && dto.preorderIds.length > 0) {
      await this.addPreorders(container.id, { preorderIds: dto.preorderIds });
    }

    return this.findOne(container.id);
  }

  /**
   * Obtener todos los contenedores sin paginación
   */
  async findAll(filters: FilterContainerDto) {
    const where = this.buildWhereClause(filters);
    
    return this.prisma.container.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        transport: true,
        preorders: {
          include: {
            preorder: {
              include: {
                client: true,
              },
            },
          },
        },
        _count: {
          select: { preorders: true },
        },
      },
    });
  }

  /**
   * Obtener contenedores con paginación
   */
  async findAllPaginated(filters: FilterContainerDto) {
    const where = this.buildWhereClause(filters);
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.container.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          transport: true,
          preorders: {
            include: {
              preorder: {
                include: {
                  client: true,
                },
              },
            },
          },
          _count: {
            select: { preorders: true },
          },
        },
      }),
      this.prisma.container.count({ where }),
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
   * Obtener un contenedor por ID
   */
  async findOne(id: string) {
    const container = await this.prisma.container.findFirst({
      where: { 
        id,
        deletedAt: null,
      },
      include: {
        transport: true,
        preorders: {
          include: {
            preorder: {
              include: {
                client: true,
                packages: {
                  include: {
                    packageType: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!container) {
      throw new NotFoundException(`Contenedor con ID ${id} no encontrado`);
    }

    return container;
  }

  /**
   * Actualizar un contenedor
   */
  async update(id: string, dto: UpdateContainerDto) {
    await this.findOne(id);

    // Verificar transporte si se proporciona
    if (dto.transportId) {
      const transport = await this.prisma.transport.findFirst({
        where: { id: dto.transportId, deletedAt: null },
      });
      if (!transport) {
        throw new NotFoundException(`Transporte con ID ${dto.transportId} no encontrado`);
      }
    }

    // Si se actualiza el código, verificar que no exista
    if (dto.code) {
      const existing = await this.prisma.container.findFirst({
        where: {
          code: dto.code,
          id: { not: id },
          deletedAt: null,
        },
      });
      if (existing) {
        throw new ConflictException(`Ya existe un contenedor con el código ${dto.code}`);
      }
    }

    const { preorderIds, ...updateData } = dto;

    // Actualizar contenedor
    await this.prisma.container.update({
      where: { id },
      data: {
        ...updateData,
        status: updateData.status as ContainerStatus,
      },
    });

    // Si se proporcionan preórdenes, reemplazar las existentes
    if (preorderIds !== undefined) {
      // Eliminar relaciones existentes
      await this.prisma.containerPreorder.deleteMany({
        where: { containerId: id },
      });

      // Agregar nuevas
      if (preorderIds.length > 0) {
        await this.addPreorders(id, { preorderIds });
      }
    }

    return this.findOne(id);
  }

  /**
   * Eliminar un contenedor (soft delete)
   */
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.container.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Restaurar un contenedor eliminado
   */
  async restore(id: string) {
    const container = await this.prisma.container.findFirst({
      where: { id, deletedAt: { not: null } },
    });

    if (!container) {
      throw new NotFoundException(`Contenedor eliminado con ID ${id} no encontrado`);
    }

    return this.prisma.container.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  /**
   * Agregar preórdenes a un contenedor
   */
  async addPreorders(containerId: string, dto: AddPreordersDto) {
    await this.findOne(containerId);

    // Verificar que las preórdenes existan
    const preorders = await this.prisma.preorder.findMany({
      where: {
        id: { in: dto.preorderIds },
        deletedAt: null,
      },
    });

    if (preorders.length !== dto.preorderIds.length) {
      const foundIds = preorders.map(p => p.id);
      const notFoundIds = dto.preorderIds.filter(id => !foundIds.includes(id));
      throw new BadRequestException(`Preórdenes no encontradas: ${notFoundIds.join(', ')}`);
    }

    // Verificar que no estén ya en el contenedor
    const existingRelations = await this.prisma.containerPreorder.findMany({
      where: {
        containerId,
        preorderId: { in: dto.preorderIds },
      },
    });

    const existingPreorderIds = existingRelations.map(r => r.preorderId);
    const newPreorderIds = dto.preorderIds.filter(id => !existingPreorderIds.includes(id));

    if (newPreorderIds.length === 0) {
      throw new BadRequestException('Todas las preórdenes ya están en este contenedor');
    }

    // Agregar relaciones
    await this.prisma.containerPreorder.createMany({
      data: newPreorderIds.map(preorderId => ({
        containerId,
        preorderId,
      })),
    });

    return this.findOne(containerId);
  }

  /**
   * Eliminar una preorden de un contenedor
   */
  async removePreorder(containerId: string, preorderId: string) {
    await this.findOne(containerId);

    const relation = await this.prisma.containerPreorder.findUnique({
      where: {
        containerId_preorderId: {
          containerId,
          preorderId,
        },
      },
    });

    if (!relation) {
      throw new NotFoundException('La preorden no está en este contenedor');
    }

    await this.prisma.containerPreorder.delete({
      where: {
        containerId_preorderId: {
          containerId,
          preorderId,
        },
      },
    });

    return this.findOne(containerId);
  }

  /**
   * Cambiar estado del contenedor
   */
  async changeStatus(id: string, status: ContainerStatus) {
    await this.findOne(id);

    return this.prisma.container.update({
      where: { id },
      data: { status },
      include: {
        transport: true,
        _count: {
          select: { preorders: true },
        },
      },
    });
  }

  /**
   * Construir cláusula WHERE con filtros parciales
   */
  private buildWhereClause(filters: FilterContainerDto) {
    const where: any = {
      deletedAt: null,
    };

    if (filters.code) {
      where.code = {
        contains: filters.code,
        mode: 'insensitive',
      };
    }

    if (filters.origin) {
      where.origin = {
        contains: filters.origin,
        mode: 'insensitive',
      };
    }

    if (filters.destination) {
      where.destination = {
        contains: filters.destination,
        mode: 'insensitive',
      };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.transportId) {
      where.transportId = filters.transportId;
    }

    return where;
  }
}

