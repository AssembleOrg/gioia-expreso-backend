import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from '@common/validators';

export class RegisterDto {
  @ApiProperty({
    description: 'Email del usuario. Debe ser único en el sistema.',
    example: 'user@example.com',
    format: 'email',
    required: true,
  })
  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario. Debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.',
    example: 'Password123',
    required: true,
    type: String,
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsStrongPassword()
  password: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
    required: true,
  })
  @IsString({ message: 'El nombre completo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre completo es requerido' })
  fullname: string;

  @ApiProperty({
    description: 'Dirección del usuario',
    example: 'Av. Corrientes 1234, CABA',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  address?: string;
}
