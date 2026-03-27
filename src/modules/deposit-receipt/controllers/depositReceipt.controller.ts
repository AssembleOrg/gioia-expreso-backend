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
    ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/enums';
import { CreateDepositReceiptDto, UpdateDepositReceiptDto, FilterDepositReceiptDto } from '../dto';
import { DepositReceiptService } from '../services';

@ApiTags('Recibos de Deposito')
@Controller('deposit-receipts')
@ApiBearerAuth()
export class DepositReceiptController {
    constructor(private readonly depositReceiptService: DepositReceiptService) { }

    @Post()
    @Roles(Role.ADMIN, Role.SUBADMIN)
    @ApiOperation({
        summary: 'Crear recibo de deposito',
        description: 'Crea un recibo de deposito'
    })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Recibo de deposito creado exitosamente',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Datos invalidos',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'No autorizado',
    })
    @ApiResponse({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        description: 'Error interno del servidor',
    })
    async create(@Body() dto: CreateDepositReceiptDto) {
        return this.depositReceiptService.create(dto);
    }

    @Get()
    @Roles(Role.ADMIN, Role.SUBADMIN, Role.USER)
    @ApiOperation({
        summary: 'Listar recibos sin paginacion',
        description: 'Obtiene todos los recibos con filtros opcionales.',
    })
    @ApiQuery({ name: 'dni', required: false, description: 'Filtrar por DNI (parcial)' })
    @ApiQuery({ name: 'cuit', required: false, description: 'Filtrar por CUIT (parcial)' })
    @ApiQuery({ name: 'startDate', required: false, type: Boolean, description: 'Filtrar por fecha de inicio' })
    @ApiQuery({ name: 'endDate', required: false, type: Boolean, description: 'Filtrar por fecha de fin' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Lista de recibos',
    })
    async findAll(@Query() filters: FilterDepositReceiptDto) {
        return this.depositReceiptService.findAll(filters);
    }

    @Get('paginated')
    @Roles(Role.ADMIN, Role.SUBADMIN)
    @ApiOperation({
        summary: 'Listar recibos con paginacion',
        description: 'Obtiene recibos paginados con filtros opcionales.',
    })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Elementos por página' })
    @ApiQuery({ name: 'dni', required: false, description: 'Filtrar por DNI (parcial)' })
    @ApiQuery({ name: 'cuit', required: false, description: 'Filtrar por CUIT (parcial)' })
    @ApiQuery({ name: 'startDate', required: false, type: Boolean, description: 'Filtrar por fecha de inicio' })
    @ApiQuery({ name: 'endDate', required: false, type: Boolean, description: 'Filtrar por fecha de fin' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Lista paginada de recibos',
    })
    async findAllPaginated(@Query() filters: FilterDepositReceiptDto) {
        return this.depositReceiptService.findAllPaginated(filters);
    }

    @Get(':id')
    @Roles(Role.ADMIN, Role.SUBADMIN)
    @ApiOperation({
        summary: 'Obtener recibo por ID',
        description: 'Obtiene un recibo específico.',
    })
    @ApiParam({ name: 'id', description: 'ID del recibo' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Recibo encontrado',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Recibo no encontrado',
    })
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.depositReceiptService.findOne(id);
    }

    @Put(':id')
    @Roles(Role.ADMIN, Role.SUBADMIN)
    @ApiOperation({
        summary: 'Actualizar recibo de deposito',
        description: 'Actualiza un recibo de deposito por id'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Recibo de deposito actualizado exitosamente',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Recibo de deposito no encontrado',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'No autorizado',
    })
    @ApiResponse({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        description: 'Error interno del servidor',
    })
    async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDepositReceiptDto) {
        return this.depositReceiptService.update(id, dto);
    }

    @Delete(':id')
    @Roles(Role.ADMIN, Role.SUBADMIN)
    @ApiOperation({
        summary: 'Eliminar recibo de deposito',
        description: 'Elimina un recibo de deposito por id'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Recibo de deposito eliminado exitosamente',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Recibo de deposito no encontrado',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'No autorizado',
    })
    @ApiResponse({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        description: 'Error interno del servidor',
    })
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.depositReceiptService.remove(id);
    }
}