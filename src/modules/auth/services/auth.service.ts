import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@prisma';
import { $Enums } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { DateTime } from 'luxon';
import { LoginDto, AuthResponseDto, RegisterDto, ChangePasswordDto } from '../dto';
import { Role } from '@common/enums';
import { EmailService } from '@email';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly BCRYPT_ROUNDS = 12;
  private readonly EMAIL_VERIFICATION_EXPIRES_HOURS = 24;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      this.logger.warn(`Intento de login fallido: usuario no encontrado para email ${loginDto.email}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.deletedAt) {
      this.logger.warn(`Intento de login fallido: usuario eliminado para email ${loginDto.email}`);
      throw new UnauthorizedException('Usuario eliminado');
    }

    // Verificar que el email esté confirmado
    if (!user.emailVerified) {
      this.logger.warn(`Intento de login fallido: email no verificado para email ${loginDto.email}`);
      throw new UnauthorizedException('Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada o solicita un nuevo enlace de verificación.');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`Intento de login fallido: contraseña incorrecta para email ${loginDto.email}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    this.logger.log(`Login exitoso para usuario ${user.email} (ID: ${user.id})`);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role as Role,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    // Verificar si el email ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Hashear la contraseña con 12 rondas
    const hashedPassword = await bcrypt.hash(registerDto.password, this.BCRYPT_ROUNDS);

    // Generar token de verificación
    const verificationToken = this.generateVerificationToken();
    const expiresAt = DateTime.now()
      .setZone('America/Argentina/Buenos_Aires')
      .plus({ hours: this.EMAIL_VERIFICATION_EXPIRES_HOURS })
      .toJSDate();

    // Crear el usuario con rol USER (email no verificado)
    // El rol puede mutar después mediante otros procesos
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        fullname: registerDto.fullname,
        address: registerDto.address,
        role: $Enums.Role.USER,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: expiresAt,
      },
    });

    // Enviar email de verificación
    await this.emailService.sendEmailVerification(
      user.email,
      user.fullname,
      verificationToken,
    );

    return {
      message: 'Registro exitoso. Por favor, verifica tu correo electrónico para activar tu cuenta. El enlace de verificación expira en 24 horas.',
    };
  }

  private generateVerificationToken(): string {
    return randomBytes(32).toString('hex');
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('Usuario eliminado');
    }

    // Verificar la contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    // Verificar que la nueva contraseña sea diferente
    const isSamePassword = await bcrypt.compare(changePasswordDto.newPassword, user.password);

    if (isSamePassword) {
      throw new BadRequestException('La nueva contraseña debe ser diferente a la actual');
    }

    // Hashear la nueva contraseña con 12 rondas
    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, this.BCRYPT_ROUNDS);

    // Actualizar la contraseña
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { message: 'Contraseña actualizada exitosamente' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: {
          equals: token,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Token de verificación inválido');
    }

    if (user.emailVerified) {
      throw new BadRequestException('El correo electrónico ya está verificado');
    }

    // Verificar si el token expiró
    if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
      // Generar nuevo token
      const newToken = this.generateVerificationToken();
      const expiresAt = DateTime.now()
        .setZone('America/Argentina/Buenos_Aires')
        .plus({ hours: this.EMAIL_VERIFICATION_EXPIRES_HOURS })
        .toJSDate();

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationToken: newToken,
          emailVerificationExpires: expiresAt,
        },
      });

      // Reenviar email
      const userWithFullname = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { email: true, fullname: true },
      });

      if (userWithFullname) {
        await this.emailService.sendEmailVerification(
          userWithFullname.email,
          userWithFullname.fullname,
          newToken,
        );
      }

      throw new BadRequestException('El enlace de verificación ha expirado. Se ha enviado un nuevo enlace a tu correo electrónico.');
    }

    // Verificar el email
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    return { message: 'Correo electrónico verificado exitosamente. Ya puedes iniciar sesión.' };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return {
        message: 'Si el email existe y no está verificado, se ha enviado un nuevo enlace de verificación.',
      };
    }

    if (user.emailVerified) {
      throw new BadRequestException('El correo electrónico ya está verificado');
    }

    // Generar nuevo token
    const verificationToken = this.generateVerificationToken();
    const expiresAt = DateTime.now()
      .setZone('America/Argentina/Buenos_Aires')
      .plus({ hours: this.EMAIL_VERIFICATION_EXPIRES_HOURS })
      .toJSDate();

    // Actualizar token y expiración
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: expiresAt,
      },
    });

    // Enviar email de verificación
    await this.emailService.sendEmailVerification(
      user.email,
      user.fullname,
      verificationToken,
    );

    return {
      message: 'Se ha enviado un nuevo enlace de verificación a tu correo electrónico. El enlace expira en 24 horas.',
    };
  }
}

