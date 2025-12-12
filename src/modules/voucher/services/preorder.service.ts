import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@prisma';
import { CreatePreorderDto, UpdatePreorderDto, PackageTypeEnum } from '../dto';
import { ClientService } from './client.service';
import { PdfService } from './pdf.service';
import { DateTime } from 'luxon';

@Injectable()
export class PreorderService {
  private readonly logger = new Logger(PreorderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clientService: ClientService,
    private readonly pdfService: PdfService,
  ) {}

  private generateVoucherNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `VCH-${timestamp}-${random}`;
  }

  private getStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      PENDING: 'pending',
      CONFIRMED: 'confirmed',
      CANCELLED: 'cancelled',
      COMPLETED: 'completed',
    };
    return statusMap[status] || 'pending';
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  async create(createPreorderDto: CreatePreorderDto) {
    // Validate that either clientId or clientData is provided
    if (!createPreorderDto.clientId && !createPreorderDto.clientData) {
      throw new BadRequestException('Debe proporcionar clientId o clientData');
    }

    let clientId = createPreorderDto.clientId;

    // If clientData is provided, create or find the client
    if (createPreorderDto.clientData) {
      const existingClient = await this.clientService.findByEmail(createPreorderDto.clientData.email);
      
      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const newClient = await this.clientService.create({
          fullname: createPreorderDto.clientData.fullname,
          phone: createPreorderDto.clientData.phone,
          email: createPreorderDto.clientData.email,
          cuit: createPreorderDto.clientData.cuit,
          address: createPreorderDto.clientData.address,
        });
        clientId = newClient.id;
      }
    }

    // Verify client exists
    const client = await this.clientService.findOne(clientId!);

    // Get package types
    const packageTypes = await this.prisma.packageType.findMany();
    const packageTypeMap = new Map(packageTypes.map(pt => [pt.type, pt]));

    // Validate packages
    for (const pkg of createPreorderDto.packages) {
      const pkgType = packageTypeMap.get(pkg.packageType);
      if (!pkgType) {
        throw new BadRequestException(`Tipo de paquete inválido: ${pkg.packageType}`);
      }

      // For BULTO (custom), dimensions are required
      if (pkg.packageType === PackageTypeEnum.BULTO) {
        if (!pkg.height || !pkg.width || !pkg.depth) {
          throw new BadRequestException('Para bultos personalizados, debe especificar alto, ancho y profundidad');
        }
      }
    }

    // Generate voucher number
    const voucherNumber = this.generateVoucherNumber();

    // Create preorder with packages
    const preorder = await this.prisma.preorder.create({
      data: {
        voucherNumber,
        clientId: clientId!,
        origin: createPreorderDto.origin,
        originPostal: createPreorderDto.originPostal,
        destination: createPreorderDto.destination,
        destinationPostal: createPreorderDto.destinationPostal,
        price: createPreorderDto.price,
        notes: createPreorderDto.notes,
        packages: {
          create: createPreorderDto.packages.map(pkg => {
            const pkgType = packageTypeMap.get(pkg.packageType)!;
            return {
              packageTypeId: pkgType.id,
              quantity: pkg.quantity,
              weight: pkg.weight,
              height: pkg.packageType === PackageTypeEnum.BULTO ? pkg.height : null,
              width: pkg.packageType === PackageTypeEnum.BULTO ? pkg.width : null,
              depth: pkg.packageType === PackageTypeEnum.BULTO ? pkg.depth : null,
              declaredValue: pkg.declaredValue || 0,
            };
          }),
        },
      },
      include: {
        client: true,
        packages: {
          include: {
            packageType: true,
          },
        },
      },
    });

    // Increment client voucher count
    await this.clientService.incrementVoucherCount(clientId!);

    // Return preorder data without generating PDF
    // PDF can be generated later using regeneratePdf endpoint
    return preorder;
  }

  private async generateAndSavePdf(preorder: any): Promise<string> {
    const now = DateTime.now().setZone('America/Argentina/Buenos_Aires');

    // Calculate totals
    const totalPackages = preorder.packages.reduce((sum: number, pkg: any) => sum + pkg.quantity, 0);
    const totalWeight = preorder.packages.reduce((sum: number, pkg: any) => sum + (pkg.weight * pkg.quantity), 0);
    const totalDeclaredValue = preorder.packages.reduce((sum: number, pkg: any) => sum + (pkg.declaredValue * pkg.quantity), 0);

    const voucherData = {
      voucherNumber: preorder.voucherNumber,
      date: now.toFormat('dd/MM/yyyy'),
      status: this.translateStatus(preorder.status),
      statusClass: this.getStatusClass(preorder.status),
      client: {
        fullname: preorder.client.fullname,
        phone: preorder.client.phone,
        email: preorder.client.email,
        cuit: preorder.client.cuit,
        address: preorder.client.address,
      },
      origin: preorder.origin,
      originPostal: preorder.originPostal,
      destination: preorder.destination,
      destinationPostal: preorder.destinationPostal,
      packages: preorder.packages.map((pkg: any) => ({
        name: pkg.packageType.name,
        isCustom: pkg.packageType.isCustom,
        height: pkg.height || pkg.packageType.height,
        width: pkg.width || pkg.packageType.width,
        depth: pkg.depth || pkg.packageType.depth,
        quantity: pkg.quantity,
        weight: pkg.weight,
        declaredValue: this.formatCurrency(pkg.declaredValue),
      })),
      totalPackages,
      totalWeight: totalWeight.toFixed(2),
      totalDeclaredValue: this.formatCurrency(totalDeclaredValue),
      price: this.formatCurrency(preorder.price),
      notes: preorder.notes,
      generatedAt: now.toFormat('dd/MM/yyyy HH:mm:ss'),
    };

    const pdfBuffer = await this.pdfService.generateVoucherPdf(voucherData);
    const filename = `${preorder.voucherNumber}.pdf`;
    
    return this.pdfService.savePdf(pdfBuffer, filename);
  }

  private translateStatus(status: string): string {
    const translations: Record<string, string> = {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmado',
      CANCELLED: 'Cancelado',
      COMPLETED: 'Completado',
    };
    return translations[status] || status;
  }

  async findAll(page = 1, limit = 10, status?: string, search?: string) {
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (status) {
      where.status = status;
    }

    // Búsqueda parcial por número de voucher
    if (search) {
      where.voucherNumber = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [preorders, total] = await Promise.all([
      this.prisma.preorder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: {
              id: true,
              fullname: true,
              email: true,
              phone: true,
            },
          },
          packages: {
            include: {
              packageType: true,
            },
          },
        },
      }),
      this.prisma.preorder.count({ where }),
    ]);

    return {
      data: preorders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const preorder = await this.prisma.preorder.findUnique({
      where: { id, deletedAt: null },
      include: {
        client: true,
        packages: {
          include: {
            packageType: true,
          },
        },
      },
    });

    if (!preorder) {
      throw new NotFoundException('Preorden no encontrada');
    }

    return preorder;
  }

  async findByVoucherNumber(voucherNumber: string) {
    const preorder = await this.prisma.preorder.findUnique({
      where: { voucherNumber, deletedAt: null },
      include: {
        client: true,
        packages: {
          include: {
            packageType: true,
          },
        },
      },
    });

    if (!preorder) {
      throw new NotFoundException('Preorden no encontrada');
    }

    return preorder;
  }

  async update(id: string, updatePreorderDto: UpdatePreorderDto) {
    const preorder = await this.findOne(id);

    // If packages are being updated, delete old ones and create new ones
    if (updatePreorderDto.packages && updatePreorderDto.packages.length > 0) {
      const packageTypes = await this.prisma.packageType.findMany();
      const packageTypeMap = new Map(packageTypes.map(pt => [pt.type, pt]));

      // Validate packages
      for (const pkg of updatePreorderDto.packages) {
        const pkgType = packageTypeMap.get(pkg.packageType);
        if (!pkgType) {
          throw new BadRequestException(`Tipo de paquete inválido: ${pkg.packageType}`);
        }

        if (pkg.packageType === PackageTypeEnum.BULTO) {
          if (!pkg.height || !pkg.width || !pkg.depth) {
            throw new BadRequestException('Para bultos personalizados, debe especificar alto, ancho y profundidad');
          }
        }
      }

      // Delete existing packages
      await this.prisma.preorderPackage.deleteMany({
        where: { preorderId: id },
      });

      // Create new packages
      await this.prisma.preorderPackage.createMany({
        data: updatePreorderDto.packages.map(pkg => {
          const pkgType = packageTypeMap.get(pkg.packageType)!;
          return {
            preorderId: id,
            packageTypeId: pkgType.id,
            quantity: pkg.quantity,
            weight: pkg.weight,
            height: pkg.packageType === PackageTypeEnum.BULTO ? pkg.height : null,
            width: pkg.packageType === PackageTypeEnum.BULTO ? pkg.width : null,
            depth: pkg.packageType === PackageTypeEnum.BULTO ? pkg.depth : null,
            declaredValue: pkg.declaredValue || 0,
          };
        }),
      });
    }

    // Update preorder fields
    const { packages, ...updateData } = updatePreorderDto;

    const updatedPreorder = await this.prisma.preorder.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        packages: {
          include: {
            packageType: true,
          },
        },
      },
    });

    // Return updated preorder data without regenerating PDF
    // PDF can be regenerated later using regeneratePdf endpoint
    return updatedPreorder;
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.preorder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getPackageTypes() {
    return this.prisma.packageType.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async regeneratePdf(id: string) {
    const preorder = await this.findOne(id);
    
    const pdfUrl = await this.generateAndSavePdf(preorder);
    
    await this.prisma.preorder.update({
      where: { id },
      data: { pdfUrl },
    });

    return { pdfUrl };
  }

  async downloadPdf(id: string): Promise<Buffer> {
    const preorder = await this.findOne(id);
    
    // Generate fresh PDF
    const now = DateTime.now().setZone('America/Argentina/Buenos_Aires');

    const totalPackages = preorder.packages.reduce((sum: number, pkg: any) => sum + pkg.quantity, 0);
    const totalWeight = preorder.packages.reduce((sum: number, pkg: any) => sum + (pkg.weight * pkg.quantity), 0);
    const totalDeclaredValue = preorder.packages.reduce((sum: number, pkg: any) => sum + (pkg.declaredValue * pkg.quantity), 0);

    const voucherData = {
      voucherNumber: preorder.voucherNumber,
      date: now.toFormat('dd/MM/yyyy'),
      status: this.translateStatus(preorder.status),
      statusClass: this.getStatusClass(preorder.status),
      client: {
        fullname: preorder.client.fullname,
        phone: preorder.client.phone,
        email: preorder.client.email,
        cuit: preorder.client.cuit,
        address: preorder.client.address,
      },
      origin: preorder.origin,
      originPostal: preorder.originPostal,
      destination: preorder.destination,
      destinationPostal: preorder.destinationPostal,
      packages: preorder.packages.map((pkg: any) => ({
        name: pkg.packageType.name,
        isCustom: pkg.packageType.isCustom,
        height: pkg.height || pkg.packageType.height,
        width: pkg.width || pkg.packageType.width,
        depth: pkg.depth || pkg.packageType.depth,
        quantity: pkg.quantity,
        weight: pkg.weight,
        declaredValue: this.formatCurrency(pkg.declaredValue),
      })),
      totalPackages,
      totalWeight: totalWeight.toFixed(2),
      totalDeclaredValue: this.formatCurrency(totalDeclaredValue),
      price: this.formatCurrency(preorder.price),
      notes: preorder.notes,
      generatedAt: now.toFormat('dd/MM/yyyy HH:mm:ss'),
    };

    return this.pdfService.generateVoucherPdf(voucherData);
  }
}

