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
import { ContainerStatus } from '@prisma/client';
import {
  CreateContainerDto,
  UpdateContainerDto,
  FilterContainerDto,
  AddPreordersDto,
  ContainerStatusEnum,
} from '../dto';
import { ContainerService } from '../services';

@ApiTags('Contenedores')
@Controller('containers')
@ApiBearerAuth()
export class ContainerController {
  constructor(private readonly containerService: ContainerService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUBADMIN)
  @ApiOperation({
    summary: 'Crear contenedor',
    description: 'Crea un nuevo contenedor de carga.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Contenedor creado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Ya existe un contenedor con ese código',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Transporte no encontrado',
  })
  async create(@Body() dto: CreateContainerDto) {
    return this.containerService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUBADMIN, Role.USER)
  @ApiOperation({
    summary: 'Listar contenedores sin paginación',
    description: 'Obtiene todos los contenedores con filtros opcionales.',
  })
  @ApiQuery({ name: 'code', required: false, description: 'Filtrar por código (parcial)' })
  @ApiQuery({ name: 'origin', required: false, description: 'Filtrar por origen (parcial)' })
  @ApiQuery({ name: 'destination', required: false, description: 'Filtrar por destino (parcial)' })
  @ApiQuery({ name: 'status', required: false, enum: ContainerStatusEnum, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'transportId', required: false, description: 'Filtrar por ID de transporte' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de contenedores',
  })
  async findAll(@Query() filters: FilterContainerDto) {
    return this.containerService.findAll(filters);
  }

  @Get('paginated')
  @Roles(Role.ADMIN, Role.SUBADMIN, Role.USER)
  @ApiOperation({
    summary: 'Listar contenedores con paginación',
    description: 'Obtiene contenedores paginados con filtros opcionales.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Elementos por página' })
  @ApiQuery({ name: 'code', required: false, description: 'Filtrar por código (parcial)' })
  @ApiQuery({ name: 'origin', required: false, description: 'Filtrar por origen (parcial)' })
  @ApiQuery({ name: 'destination', required: false, description: 'Filtrar por destino (parcial)' })
  @ApiQuery({ name: 'status', required: false, enum: ContainerStatusEnum, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'transportId', required: false, description: 'Filtrar por ID de transporte' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista paginada de contenedores',
  })
  async findAllPaginated(@Query() filters: FilterContainerDto) {
    return this.containerService.findAllPaginated(filters);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUBADMIN, Role.USER)
  @ApiOperation({
    summary: 'Obtener contenedor por ID',
    description: 'Obtiene un contenedor específico con sus preórdenes.',
  })
  @ApiParam({ name: 'id', description: 'ID del contenedor' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contenedor encontrado',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Contenedor no encontrado',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.containerService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.SUBADMIN)
  @ApiOperation({
    summary: 'Actualizar contenedor',
    description: 'Actualiza los datos de un contenedor.',
  })
  @ApiParam({ name: 'id', description: 'ID del contenedor' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contenedor actualizado',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Contenedor o transporte no encontrado',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContainerDto,
  ) {
    return this.containerService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Eliminar contenedor',
    description: 'Elimina un contenedor (soft delete).',
  })
  @ApiParam({ name: 'id', description: 'ID del contenedor' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contenedor eliminado',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Contenedor no encontrado',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.containerService.remove(id);
  }

  @Patch(':id/restore')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Restaurar contenedor',
    description: 'Restaura un contenedor previamente eliminado.',
  })
  @ApiParam({ name: 'id', description: 'ID del contenedor' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contenedor restaurado',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Contenedor eliminado no encontrado',
  })
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.containerService.restore(id);
  }

  @Post(':id/preorders')
  @Roles(Role.ADMIN, Role.SUBADMIN)
  @ApiOperation({
    summary: 'Agregar preórdenes al contenedor',
    description: 'Agrega una o más preórdenes a un contenedor.',
  })
  @ApiParam({ name: 'id', description: 'ID del contenedor' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Preórdenes agregadas',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Contenedor o preorden no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Las preórdenes ya están en el contenedor',
  })
  async addPreorders(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddPreordersDto,
  ) {
    return this.containerService.addPreorders(id, dto);
  }

  @Delete(':id/preorders/:preorderId')
  @Roles(Role.ADMIN, Role.SUBADMIN)
  @ApiOperation({
    summary: 'Eliminar preorden del contenedor',
    description: 'Elimina una preorden de un contenedor.',
  })
  @ApiParam({ name: 'id', description: 'ID del contenedor' })
  @ApiParam({ name: 'preorderId', description: 'ID de la preorden' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Preorden eliminada del contenedor',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Contenedor o preorden no encontrado',
  })
  async removePreorder(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('preorderId', ParseUUIDPipe) preorderId: string,
  ) {
    return this.containerService.removePreorder(id, preorderId);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.SUBADMIN)
  @ApiOperation({
    summary: 'Cambiar estado del contenedor',
    description: 'Actualiza el estado de un contenedor (ON_LOAD, TRAVELLING, ARRIVED).',
  })
  @ApiParam({ name: 'id', description: 'ID del contenedor' })
  @ApiQuery({
    name: 'status',
    required: true,
    enum: ContainerStatusEnum,
    description: 'Nuevo estado',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estado actualizado',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Contenedor no encontrado',
  })
  async changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status: ContainerStatus,
  ) {
    return this.containerService.changeStatus(id, status);
  }
}

