import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@prisma';
import { paginar } from '@common/pagination';
import {
  CreateRecipientDto,
  UpdateRecipientDto,
  FilterRecipientDto,
} from '../dto';

@Injectable()
export class RecipientsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(filters: FilterRecipientDto): Prisma.RecipientWhereInput {
    const where: Prisma.RecipientWhereInput = { deletedAt: null };

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.search) {
      const contiene = {
        contains: filters.search,
        mode: 'insensitive' as const,
      };
      where.OR = [
        { fullname: contiene },
        { dni: contiene },
        { phone: contiene },
        { city: contiene },
      ];
    }

    return where;
  }

  // Si viene clientId, tiene que ser un cliente vivo
  private async validarCliente(clientId?: string | null) {
    if (!clientId) return;
    const cliente = await this.prisma.client.findFirst({
      where: { id: clientId, deletedAt: null },
      select: { id: true },
    });
    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }
  }

  async create(dto: CreateRecipientDto) {
    await this.validarCliente(dto.clientId);
    return this.prisma.recipient.create({ data: dto });
  }

  async findAll(filters: FilterRecipientDto) {
    const where = this.buildWhere(filters);
    const { page, limit, skip } = paginar(filters.page, filters.limit);

    const [data, total] = await Promise.all([
      this.prisma.recipient.findMany({
        where,
        skip,
        take: limit,
        // id como desempate para que la paginación sea estable
        orderBy: [{ fullname: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.recipient.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const recipient = await this.prisma.recipient.findFirst({
      where: { id, deletedAt: null },
    });

    if (!recipient) {
      throw new NotFoundException('Destinatario no encontrado');
    }

    return recipient;
  }

  async update(id: string, dto: UpdateRecipientDto) {
    // El PUT es parcial y deja pasar null, pero estos dos no se pueden vaciar
    if (dto.fullname === null || dto.address === null) {
      throw new BadRequestException(
        'El nombre y la dirección no se pueden vaciar',
      );
    }

    await this.findOne(id);
    await this.validarCliente(dto.clientId);

    return this.prisma.recipient.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.recipient.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
