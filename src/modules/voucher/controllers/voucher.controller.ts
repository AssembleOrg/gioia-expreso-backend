import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  ParseUUIDPipe,
  HttpStatus,
  Request,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '@common/decorators';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/enums';
import { PreorderService, ClientService } from '../services';
import {
  CreatePreorderDto,
  UpdatePreorderDto,
  CreateClientDto,
  UpdateClientDto,
  BulkUpdatePreorderDto,
} from '../dto';

@ApiTags('Vouchers')
@ApiBearerAuth()
@Controller('voucher')
export class VoucherController {
  constructor(
    private readonly preorderService: PreorderService,
    private readonly clientService: ClientService,
  ) {}

  // ==================== PREORDERS ====================

  @Post('preorders')
  @ApiOperation({
    summary: 'Crear una nueva preorden',
    description:
      'Crea una preorden con datos del cliente, origen, destino y paquetes. Los usuarios con rol USER crean preorders con estado CREATED (requieren aprobación). Los ADMIN/SUBADMIN crean con estado PENDING.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Preorden creada exitosamente',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        voucherNumber: 'VCH-M8X5K2-ABCD',
        clientId: '550e8400-e29b-41d4-a716-446655440001',
        origin: 'Av. Rivadavia 1000, Buenos Aires',
        originPostal: '1033',
        destination: 'Av. San Martín 500, Córdoba',
        destinationPostal: '5000',
        price: 15000.5,
        status: 'CREATED',
        pdfUrl: '/public/vouchers/VCH-M8X5K2-ABCD.pdf',
        createdAt: '2025-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos inválidos',
  })
  async createPreorder(
    @Body() createPreorderDto: CreatePreorderDto,
    @Request() req: any,
  ) {
    const userRole = req.user?.role;
    return this.preorderService.create(createPreorderDto, userRole);
  }

  @Get('preorders')
  @ApiOperation({
    summary: 'Listar preórdenes',
    description:
      'Obtiene una lista paginada de preórdenes con opción de filtrar por estado y buscar por número de voucher',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['CREATED', 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Buscar por número de voucher (búsqueda parcial)',
    example: 'VCH-M8X',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de preórdenes',
  })
  async findAllPreorders(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.preorderService.findAll(+page, +limit, status, search);
  }

  @Public()
  @Get('preorders/:id')
  @ApiOperation({
    summary: 'Obtener una preorden por ID',
    description:
      'Obtiene los detalles completos de una preorden incluyendo cliente y paquetes. Este endpoint es público para permitir el tracking de envíos.',
  })
  @ApiParam({ name: 'id', description: 'ID de la preorden (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Preorden encontrada' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Preorden no encontrada',
  })
  async findOnePreorder(@Param('id', ParseUUIDPipe) id: string) {
    return this.preorderService.findOne(id);
  }

  @Public()
  @Get('preorders/voucher/:voucherNumber')
  @ApiOperation({
    summary: 'Buscar preorden por número de voucher',
    description:
      'Obtiene una preorden usando su número de voucher único. Este endpoint es público para permitir el tracking de envíos.',
  })
  @ApiParam({
    name: 'voucherNumber',
    description: 'Número de voucher',
    example: 'VCH-M8X5K2-ABCD',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Preorden encontrada' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Preorden no encontrada',
  })
  async findByVoucherNumber(@Param('voucherNumber') voucherNumber: string) {
    return this.preorderService.findByVoucherNumber(voucherNumber);
  }

  @Put('preorders/:id')
  @ApiOperation({
    summary: 'Actualizar una preorden',
    description:
      'Actualiza los datos de una preorden existente. Si se actualizan paquetes, regenera el PDF.',
  })
  @ApiParam({ name: 'id', description: 'ID de la preorden (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Preorden actualizada' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Preorden no encontrada',
  })
  async updatePreorder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePreorderDto: UpdatePreorderDto,
  ) {
    return this.preorderService.update(id, updatePreorderDto);
  }

  @Delete('preorders/:id')
  @ApiOperation({
    summary: 'Eliminar una preorden',
    description: 'Elimina (soft delete) una preorden existente',
  })
  @ApiParam({ name: 'id', description: 'ID de la preorden (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Preorden eliminada' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Preorden no encontrada',
  })
  async removePreorder(@Param('id', ParseUUIDPipe) id: string) {
    return this.preorderService.remove(id);
  }

  // ==================== PDF ====================

  @Get('preorders/:id/pdf')
  @ApiOperation({
    summary: 'Descargar PDF del voucher',
    description: 'Genera y descarga el PDF del voucher de una preorden',
  })
  @ApiParam({ name: 'id', description: 'ID de la preorden (UUID)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'PDF del voucher',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Preorden no encontrada',
  })
  async downloadPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const preorder = await this.preorderService.findOne(id);
    const pdfBuffer = await this.preorderService.downloadPdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${preorder.voucherNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  @Post('preorders/:id/regenerate-pdf')
  @ApiOperation({
    summary: 'Regenerar PDF del voucher',
    description: 'Regenera el PDF del voucher y actualiza la URL almacenada',
  })
  @ApiParam({ name: 'id', description: 'ID de la preorden (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'PDF regenerado' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Preorden no encontrada',
  })
  async regeneratePdf(@Param('id', ParseUUIDPipe) id: string) {
    return this.preorderService.regeneratePdf(id);
  }

  // ==================== PACKAGE TYPES ====================

  @Get('package-types')
  @ApiOperation({
    summary: 'Obtener tipos de paquetes',
    description:
      'Lista todos los tipos de paquetes disponibles (Bulto, Bolsas 20x32, 30x41, 42x54, 70x80)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de tipos de paquetes',
    schema: {
      example: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Bulto',
          type: 'BULTO',
          height: 0,
          width: 0,
          depth: 0,
          weight: 0,
          imageUrl: '/public/packages/bulto.png',
          isCustom: true,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Bolsa 20x32',
          type: 'BAG_20X32',
          height: 32,
          width: 20,
          depth: 10,
          weight: 2,
          imageUrl: '/public/packages/bag-20x32.png',
          isCustom: false,
        },
      ],
    },
  })
  async getPackageTypes() {
    return this.preorderService.getPackageTypes();
  }

  // ==================== CLIENTS ====================

  @Post('clients')
  @ApiOperation({
    summary: 'Crear un nuevo cliente',
    description: 'Registra un nuevo cliente en el sistema',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Cliente creado' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email ya existe' })
  async createClient(@Body() createClientDto: CreateClientDto) {
    return this.clientService.create(createClientDto);
  }

  @Get('clients')
  @ApiOperation({
    summary: 'Listar clientes',
    description: 'Obtiene una lista paginada de clientes',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de clientes' })
  async findAllClients(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.clientService.findAll(+page, +limit);
  }

  @Get('clients/:id')
  @ApiOperation({
    summary: 'Obtener un cliente por ID',
    description:
      'Obtiene los detalles de un cliente incluyendo sus preórdenes recientes',
  })
  @ApiParam({ name: 'id', description: 'ID del cliente (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cliente encontrado' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cliente no encontrado',
  })
  async findOneClient(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientService.findOne(id);
  }

  @Put('clients/:id')
  @ApiOperation({
    summary: 'Actualizar un cliente',
    description: 'Actualiza los datos de un cliente existente',
  })
  @ApiParam({ name: 'id', description: 'ID del cliente (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cliente actualizado' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cliente no encontrado',
  })
  async updateClient(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientService.update(id, updateClientDto);
  }

  @Delete('clients/:id')
  @ApiOperation({
    summary: 'Eliminar un cliente',
    description: 'Elimina (soft delete) un cliente existente',
  })
  @ApiParam({ name: 'id', description: 'ID del cliente (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cliente eliminado' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cliente no encontrado',
  })
  async removeClient(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientService.remove(id);
  }

  // ==================== PREORDER APPROVAL ====================

  @Patch('preorders/:id/approve')
  @Roles(Role.ADMIN, Role.SUBADMIN)
  @ApiOperation({
    summary: 'Aprobar una preorden',
    description: 'Aprueba una preorden con estado CREATED, cambiándola a PENDING. Solo disponible para ADMIN y SUBADMIN.',
  })
  @ApiParam({ name: 'id', description: 'ID de la preorden (UUID)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Preorden aprobada exitosamente',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        voucherNumber: 'VCH-M8X5K2-ABCD',
        status: 'PENDING',
        message: 'Preorden aprobada exitosamente',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'La preorden no está en estado CREATED o ya fue procesada',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Preorden no encontrada',
  })
  async approvePreorder(@Param('id', ParseUUIDPipe) id: string) {
    return this.preorderService.approvePreorder(id);
  }

  @Patch('preorders/:id/reject')
  @Roles(Role.ADMIN, Role.SUBADMIN)
  @ApiOperation({
    summary: 'Rechazar una preorden',
    description: 'Rechaza una preorden con estado CREATED, cambiándola a CANCELLED. Solo disponible para ADMIN y SUBADMIN.',
  })
  @ApiParam({ name: 'id', description: 'ID de la preorden (UUID)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Preorden rechazada exitosamente',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        voucherNumber: 'VCH-M8X5K2-ABCD',
        status: 'CANCELLED',
        message: 'Preorden rechazada exitosamente',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'La preorden no está en estado CREATED o ya fue procesada',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Preorden no encontrada',
  })
  async rejectPreorder(@Param('id', ParseUUIDPipe) id: string) {
    return this.preorderService.rejectPreorder(id);
  }

  @Patch('preorders/bulk-update-status')
  @Roles(Role.ADMIN, Role.SUBADMIN)
  @ApiOperation({
    summary: 'Actualización masiva de estado de preorders',
    description: 'Actualiza el estado de múltiples preorders a la vez. Solo disponible para ADMIN y SUBADMIN.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Preorders actualizadas exitosamente',
    schema: {
      example: {
        message: 'Se actualizaron 3 preorder(s) exitosamente',
        count: 3,
        status: 'PENDING',
        preorders: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            voucherNumber: 'VCH-M8X5K2-ABCD',
            status: 'PENDING',
            // ... más campos
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos inválidos (IDs vacíos, estado inválido, etc.)',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Una o más preorders no fueron encontradas',
  })
  async bulkUpdateStatus(@Body() bulkUpdateDto: BulkUpdatePreorderDto) {
    return this.preorderService.bulkUpdateStatus(bulkUpdateDto);
  }
}
