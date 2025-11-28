import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from '@common/validators';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Contraseña actual del usuario. Se valida antes de permitir el cambio.',
    example: 'OldPassword123',
    required: true,
    type: String,
  })
  @IsString({ message: 'La contraseña actual debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña actual es requerida' })
  currentPassword: string;

  @ApiProperty({
    description: 'Nueva contraseña. Debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número. Debe ser diferente a la contraseña actual.',
    example: 'NewPassword123',
    required: true,
    type: String,
  })
  @IsString({ message: 'La nueva contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La nueva contraseña es requerida' })
  @IsStrongPassword()
  newPassword: string;
}

