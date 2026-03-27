import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@prisma';
import { CreateDepositReceiptDto, UpdateDepositReceiptDto, FilterDepositReceiptDto } from '../dto';

@Injectable()
export class DepositReceiptService {
    constructor(private readonly prisma: PrismaService) { }

    private buildWhereClause(filters: FilterDepositReceiptDto) {
        const where: any = { deletedAt: null }

        if (filters.cuit) {
            where.cuit = filters.cuit
        }

        if (filters.dni) {
            where.dni = filters.dni
        }

        if (filters.startDate || filters.endDate) {
            where.createdAt = {};

            if (filters.startDate) {
                where.createdAt.gte = filters.startDate;
            }

            if (filters.endDate) {
                where.createdAt.lte = filters.endDate;
            }
        }

        return where
    }

    async create(dto: CreateDepositReceiptDto) {
        return this.prisma.depositReceipt.create({
            data: dto
        })
    }

    async findAll(filters: FilterDepositReceiptDto) {
        const where = this.buildWhereClause(filters)

        const depositReceipts = await this.prisma.depositReceipt.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        })

        return depositReceipts
    }

    async findAllPaginated(filters: FilterDepositReceiptDto) {
        const where = this.buildWhereClause(filters)
        const page = filters.page || 1
        const limit = filters.limit || 10
        const skip = (page - 1) * limit

        const [data, total] = await Promise.all([
            this.prisma.depositReceipt.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.depositReceipt.count({ where }),
        ])

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
        }
    }

    async findOne(id: string) {
        const depostiReceipt = await this.prisma.depositReceipt.findFirst({
            where: { id, deletedAt: null }
        })

        if (!depostiReceipt) {
            throw new NotFoundException(`No se encontro el recibo con id ${id}`)
        }

        return depostiReceipt
    }

    async update(id: string, dto: UpdateDepositReceiptDto) {
        await this.findOne(id)

        return this.prisma.depositReceipt.update({
            where: { id },
            data: dto,
        })
    }

    async remove(id: string) {
        await this.findOne(id)

        return this.prisma.depositReceipt.update({
            where: { id },
            data: { deletedAt: new Date() },
        })
    }


}