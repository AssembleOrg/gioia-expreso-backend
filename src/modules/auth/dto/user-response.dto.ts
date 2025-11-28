import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@common/enums';

export class UserResponseDto {
  @ApiProperty({
    description: 'ID único del usuario',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'user@example.com',
    format: 'email',
  })
  email: string;

  @ApiProperty({
    description: 'Rol del usuario',
    enum: Role,
    example: Role.USER,
  })
  role: Role;
}


