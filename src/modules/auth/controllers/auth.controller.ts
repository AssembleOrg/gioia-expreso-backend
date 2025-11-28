import { Controller, Post, Body, HttpCode, HttpStatus, Patch, Request, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../services';
import { LoginDto, AuthResponseDto, RegisterDto, ChangePasswordDto, VerifyEmailDto, ResendVerificationDto } from '../dto';
import { Public } from '@common/decorators';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Iniciar sesión', 
    description: 'Autentica un usuario con email y contraseña. Retorna un token JWT que debe ser incluido en el header Authorization como Bearer token para acceder a endpoints protegidos.' 
  })
  @ApiResponse({
    status: 200,
    description: 'Autenticación exitosa. Retorna el token JWT y la información del usuario.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas. El email o la contraseña son incorrectos, o el usuario ha sido eliminado.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Credenciales inválidas' },
        timestamp: { type: 'string', format: 'date-time' },
        path: { type: 'string', example: '/api/auth/login' },
      },
    },
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Registrar nuevo usuario', 
    description: 'Registra un nuevo usuario en el sistema con rol USER por defecto. El rol puede ser modificado posteriormente. Se envía un email de confirmación que debe ser verificado antes de poder iniciar sesión. El enlace de verificación expira en 24 horas. Solo requiere email, contraseña, nombre completo y opcionalmente dirección.' 
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente. Se ha enviado un email de confirmación.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Registro exitoso. Por favor, verifica tu correo electrónico para activar tu cuenta. El enlace de verificación expira en 24 horas.' },
        timestamp: { type: 'string', format: 'date-time' },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Registro exitoso. Por favor, verifica tu correo electrónico para activar tu cuenta. El enlace de verificación expira en 24 horas.' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'El email proporcionado ya está registrado en el sistema.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'El email ya está registrado' },
        timestamp: { type: 'string', format: 'date-time' },
        path: { type: 'string', example: '/api/auth/register' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos. Verificar formato de email, validación de contraseña, etc.',
  })
  async register(@Body() registerDto: RegisterDto): Promise<{ message: string }> {
    return this.authService.register(registerDto);
  }

  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Cambiar contraseña', 
    description: 'Permite a un usuario autenticado cambiar su contraseña. Requiere autenticación mediante token JWT. Se valida la contraseña actual antes de permitir el cambio.' 
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña actualizada exitosamente.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Contraseña actualizada exitosamente' },
        timestamp: { type: 'string', format: 'date-time' },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Contraseña actualizada exitosamente' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. La contraseña actual es incorrecta, el token JWT es inválido o el usuario ha sido eliminado.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'La contraseña actual es incorrecta' },
        timestamp: { type: 'string', format: 'date-time' },
        path: { type: 'string', example: '/api/auth/change-password' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Solicitud inválida. La nueva contraseña debe ser diferente a la contraseña actual.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'La nueva contraseña debe ser diferente a la actual' },
        timestamp: { type: 'string', format: 'date-time' },
        path: { type: 'string', example: '/api/auth/change-password' },
      },
    },
  })
  async changePassword(
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(req.user.id, changePasswordDto);
  }

  @Public()
  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Verificar correo electrónico', 
    description: 'Verifica el correo electrónico del usuario usando el token recibido por email. Si el token ha expirado, se genera y envía automáticamente un nuevo token.' 
  })
  @ApiResponse({
    status: 200,
    description: 'Correo electrónico verificado exitosamente.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Correo electrónico verificado exitosamente. Ya puedes iniciar sesión.' },
        timestamp: { type: 'string', format: 'date-time' },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Correo electrónico verificado exitosamente. Ya puedes iniciar sesión.' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Token inválido, expirado, o el correo ya está verificado. Si expiró, se envía un nuevo enlace automáticamente.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'El enlace de verificación ha expirado. Se ha enviado un nuevo enlace a tu correo electrónico.' },
        timestamp: { type: 'string', format: 'date-time' },
        path: { type: 'string', example: '/api/auth/verify-email' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Token de verificación no encontrado.',
  })
  async verifyEmail(@Query('token') token: string): Promise<{ message: string }> {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Reenviar enlace de verificación', 
    description: 'Reenvía el enlace de verificación de correo electrónico. Genera un nuevo token válido por 24 horas.' 
  })
  @ApiResponse({
    status: 200,
    description: 'Se ha enviado un nuevo enlace de verificación.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Se ha enviado un nuevo enlace de verificación a tu correo electrónico. El enlace expira en 24 horas.' },
        timestamp: { type: 'string', format: 'date-time' },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Se ha enviado un nuevo enlace de verificación a tu correo electrónico. El enlace expira en 24 horas.' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'El correo electrónico ya está verificado.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'El correo electrónico ya está verificado' },
        timestamp: { type: 'string', format: 'date-time' },
        path: { type: 'string', example: '/api/auth/resend-verification' },
      },
    },
  })
  async resendVerification(@Body() resendVerificationDto: ResendVerificationDto): Promise<{ message: string }> {
    return this.authService.resendVerification(resendVerificationDto.email);
  }
}

