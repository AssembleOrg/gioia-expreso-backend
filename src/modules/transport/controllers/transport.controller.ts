import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
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
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/enums';
import { CreateTransportDto, UpdateTransportDto, FilterTransportDto } from '../dto';
import { TransportService } from '../services';

@ApiTags('Transportes')
@Controller('transports')
@ApiBearerAuth()
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUBADMIN)
  @ApiOperation({
    summary: 'Crear transporte',
    description: 'Crea un nuevo transporte/vehículo.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Transporte creado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Ya existe un transporte con esa patente',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos',
  })
  async create(@Body() dto: CreateTransportDto) {
    return this.transportService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUBADMIN, Role.USER)
  @ApiOperation({
    summary: 'Listar transportes sin paginación',
    description: 'Obtiene todos los transportes con filtros opcionales.',
  })
  @ApiQuery({ name: 'name', required: false, description: 'Filtrar por nombre (parcial)' })
  @ApiQuery({ name: 'licensePlate', required: false, description: 'Filtrar por patente (parcial)' })
  @ApiQuery({ name: 'available', required: false, type: Boolean, description: 'Filtrar por disponibilidad' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de transportes',
  })
  async findAll(@Query() filters: FilterTransportDto) {
    return this.transportService.findAll(filters);
  }

  @Get('paginated')
  @Roles(Role.ADMIN, Role.SUBADMIN, Role.USER)
  @ApiOperation({
    summary: 'Listar transportes con paginación',
    description: 'Obtiene transportes paginados con filtros opcionales.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Elementos por página' })
  @ApiQuery({ name: 'name', required: false, description: 'Filtrar por nombre (parcial)' })
  @ApiQuery({ name: 'licensePlate', required: false, description: 'Filtrar por patente (parcial)' })
  @ApiQuery({ name: 'available', required: false, type: Boolean, description: 'Filtrar por disponibilidad' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista paginada de transportes',
  })
  async findAllPaginated(@Query() filters: FilterTransportDto) {
    return this.transportService.findAllPaginated(filters);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUBADMIN, Role.USER)
  @ApiOperation({
    summary: 'Obtener transporte por ID',
    description: 'Obtiene un transporte específico con sus contenedores.',
  })
  @ApiParam({ name: 'id', description: 'ID del transporte' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transporte encontrado',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Transporte no encontrado',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.transportService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.SUBADMIN)
  @ApiOperation({
    summary: 'Actualizar transporte',
    description: 'Actualiza los datos de un transporte.',
  })
  @ApiParam({ name: 'id', description: 'ID del transporte' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transporte actualizado',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Transporte no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Ya existe un transporte con esa patente',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransportDto,
  ) {
    return this.transportService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Eliminar transporte',
    description: 'Elimina un transporte (soft delete).',
  })
  @ApiParam({ name: 'id', description: 'ID del transporte' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transporte eliminado',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Transporte no encontrado',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.transportService.remove(id);
  }

  @Patch(':id/restore')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Restaurar transporte',
    description: 'Restaura un transporte previamente eliminado.',
  })
  @ApiParam({ name: 'id', description: 'ID del transporte' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transporte restaurado',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Transporte eliminado no encontrado',
  })
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.transportService.restore(id);
  }
}

