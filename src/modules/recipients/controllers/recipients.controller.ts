import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Roles } from '@common/decorators';
import { Role } from '@common/enums';
import {
  CreateRecipientDto,
  UpdateRecipientDto,
  FilterRecipientDto,
} from '../dto';
import { RecipientsService } from '../services';

const EJEMPLO_DESTINATARIO = {
  id: '7d1f0c2a-3b4e-4f5a-9c8d-1e2f3a4b5c6d',
  fullname: 'María González',
  dni: '30123456',
  phone: '+54 351 555-1234',
  email: 'maria@email.com',
  address: 'Av. Colón 1234, piso 2 B',
  city: 'Córdoba',
  province: 'Córdoba',
  postalCode: '5000',
  notes: 'Recibe de 9 a 13',
  clientId: '550e8400-e29b-41d4-a716-446655440001',
  createdAt: '2026-10-04T12:00:00.000Z',
  updatedAt: '2026-10-04T12:00:00.000Z',
  deletedAt: null,
};

@ApiTags('Destinatarios')
@ApiBearerAuth()
@Controller('recipients')
export class RecipientsController {
  constructor(private readonly recipientsService: RecipientsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUBADMIN)
  @ApiOperation({
    summary: 'Listar destinatarios',
    description:
      'Agenda paginada de destinatarios, ordenada por nombre. `search` busca en nombre, DNI, teléfono y localidad.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista paginada de destinatarios',
    schema: {
      example: {
        data: [EJEMPLO_DESTINATARIO],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      },
    },
  })
  async findAll(@Query() filters: FilterRecipientDto) {
    return this.recipientsService.findAll(filters);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUBADMIN)
  @ApiOperation({ summary: 'Obtener un destinatario por ID' })
  @ApiParam({ name: 'id', description: 'ID del destinatario (UUID)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Destinatario encontrado',
    schema: { example: EJEMPLO_DESTINATARIO },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Destinatario no encontrado',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.recipientsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUBADMIN)
  @ApiOperation({
    summary: 'Crear destinatario',
    description: 'Agrega un destinatario a la agenda',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Destinatario creado',
    schema: { example: EJEMPLO_DESTINATARIO },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Datos inválidos' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'El cliente indicado no existe',
  })
  async create(@Body() dto: CreateRecipientDto) {
    return this.recipientsService.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.SUBADMIN)
  @ApiOperation({
    summary: 'Actualizar destinatario',
    description:
      'Actualización parcial: solo se tocan los campos enviados. Un opcional en "" o null se borra.',
  })
  @ApiParam({ name: 'id', description: 'ID del destinatario (UUID)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Destinatario actualizado',
    schema: { example: EJEMPLO_DESTINATARIO },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Datos inválidos' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Destinatario o cliente no encontrado',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRecipientDto,
  ) {
    return this.recipientsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUBADMIN)
  @ApiOperation({
    summary: 'Eliminar destinatario',
    description: 'Baja lógica (soft delete) del destinatario',
  })
  @ApiParam({ name: 'id', description: 'ID del destinatario (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Destinatario eliminado' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Destinatario no encontrado',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.recipientsService.remove(id);
  }
}
