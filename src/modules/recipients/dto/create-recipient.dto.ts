import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  IsUUID,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

// Recorta espacios de los obligatorios
const recortar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// En los opcionales, un string vacío es "sin dato": queda en null,
// así en el PUT sirve para borrar el valor que tenía
const recortarOpcional = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const limpio = value.trim();
  return limpio === '' ? null : limpio;
};

export class CreateRecipientDto {
  @ApiProperty({
    description: 'Nombre completo del destinatario',
    example: 'María González',
    maxLength: 100,
  })
  @Transform(recortar)
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres' })
  fullname: string;

  @ApiPropertyOptional({
    description: 'DNI del destinatario (solo números, 7 a 9 dígitos)',
    example: '30123456',
  })
  @Transform(recortarOpcional)
  @IsOptional()
  @IsString({ message: 'El DNI debe ser texto' })
  @Matches(/^\d{7,9}$/, {
    message: 'El DNI debe tener entre 7 y 9 dígitos, sin puntos',
  })
  dni?: string | null;

  @ApiPropertyOptional({
    description: 'Teléfono del destinatario',
    example: '+54 351 555-1234',
    maxLength: 30,
  })
  @Transform(recortarOpcional)
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto' })
  @MaxLength(30, { message: 'El teléfono no puede superar los 30 caracteres' })
  phone?: string | null;

  @ApiPropertyOptional({
    description: 'Email del destinatario',
    example: 'maria@email.com',
  })
  @Transform(recortarOpcional)
  @IsOptional()
  @IsEmail({}, { message: 'El email no es válido' })
  @MaxLength(150, { message: 'El email no puede superar los 150 caracteres' })
  email?: string | null;

  @ApiProperty({
    description: 'Dirección de entrega',
    example: 'Av. Colón 1234, piso 2 B',
    maxLength: 200,
  })
  @Transform(recortar)
  @IsString({ message: 'La dirección debe ser texto' })
  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  @MaxLength(200, {
    message: 'La dirección no puede superar los 200 caracteres',
  })
  address: string;

  @ApiPropertyOptional({ description: 'Localidad', example: 'Córdoba', maxLength: 100 })
  @Transform(recortarOpcional)
  @IsOptional()
  @IsString({ message: 'La localidad debe ser texto' })
  @MaxLength(100, { message: 'La localidad no puede superar los 100 caracteres' })
  city?: string | null;

  @ApiPropertyOptional({ description: 'Provincia', example: 'Córdoba', maxLength: 100 })
  @Transform(recortarOpcional)
  @IsOptional()
  @IsString({ message: 'La provincia debe ser texto' })
  @MaxLength(100, { message: 'La provincia no puede superar los 100 caracteres' })
  province?: string | null;

  @ApiPropertyOptional({ description: 'Código postal', example: '5000', maxLength: 10 })
  @Transform(recortarOpcional)
  @IsOptional()
  @IsString({ message: 'El código postal debe ser texto' })
  @MaxLength(10, { message: 'El código postal no puede superar los 10 caracteres' })
  postalCode?: string | null;

  @ApiPropertyOptional({
    description: 'Notas internas (horarios, referencias, etc.)',
    example: 'Recibe de 9 a 13, tocar timbre 2B',
    maxLength: 500,
  })
  @Transform(recortarOpcional)
  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  @MaxLength(500, { message: 'Las notas no pueden superar los 500 caracteres' })
  notes?: string | null;

  @ApiPropertyOptional({
    description: 'ID del cliente (remitente) que suele mandarle. null lo desasocia',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @Transform(recortarOpcional)
  @IsOptional()
  @IsUUID('all', { message: 'El clientId debe ser un UUID válido' })
  clientId?: string | null;
}
