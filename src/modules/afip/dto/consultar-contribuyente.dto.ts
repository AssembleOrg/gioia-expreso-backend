import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { AfipCredentialsDto } from './afip-credentials.dto';

export class ConsultarContribuyenteDto extends AfipCredentialsDto {
  @ApiProperty({
    description: 'CUIT del contribuyente a consultar',
    example: '30123456789',
  })
  @IsString({ message: 'El CUIT a consultar debe ser un string' })
  @IsNotEmpty({ message: 'El CUIT a consultar es requerido' })
  cuitConsultar: string;
}

