import { Controller, Get, Post, Body, Query, Param, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Public } from '@common/decorators';
import { CalculatorService } from '../services';
import { SearchLocalidadesDto, CotizarDto, LocalidadesResponseDto, CotizacionResponseDto, FilialResponseDto } from '../dto';

@ApiTags('Calculator')
@Controller('calculator')
export class CalculatorController {
  constructor(private readonly calculatorService: CalculatorService) {}

  @Public()
  @Get('localidades')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar localidades',
    description: 'Busca localidades disponibles para envíos. Endpoint público que oculta el origen de la petición.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de localidades encontradas',
    type: LocalidadesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros inválidos',
  })
  @ApiResponse({
    status: 500,
    description: 'Error al comunicarse con la API externa',
  })
  async searchLocalidades(@Query() query: SearchLocalidadesDto): Promise<LocalidadesResponseDto> {
    return this.calculatorService.searchLocalidades(query.q, query.cobertura);
  }

  @Public()
  @Post('cotizar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cotizar envío',
    description: 'Obtiene una cotización de envío con diferentes opciones de servicio. Endpoint público que oculta el origen de la petición.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cotización exitosa',
    type: CotizacionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de cotización inválidos',
  })
  @ApiResponse({
    status: 500,
    description: 'Error al comunicarse con la API externa',
  })
  async cotizar(@Body() dto: CotizarDto): Promise<CotizacionResponseDto> {
    return this.calculatorService.cotizar(dto);
  }

  @Public()
  @Get('public/filiales/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener información de una filial',
    description: 'Obtiene la información pública de una filial por su ID. Endpoint público que oculta el origen de la petición.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la filial',
    type: Number,
    example: 15,
  })
  @ApiResponse({
    status: 200,
    description: 'Información de la filial',
    type: FilialResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Filial no encontrada',
  })
  @ApiResponse({
    status: 500,
    description: 'Error al comunicarse con la API externa',
  })
  async getFilial(@Param('id', ParseIntPipe) id: number): Promise<FilialResponseDto> {
    return this.calculatorService.getFilial(id);
  }
}

