import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DateTime } from 'luxon';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Error interno del servidor';

    const errorMessage =
      typeof message === 'string'
        ? message
        : (message as { message: string | string[] }).message;

    const finalMessage = Array.isArray(errorMessage)
      ? errorMessage.join(', ')
      : errorMessage;

    response.status(status).json({
      success: false,
      message: finalMessage || 'Error interno del servidor',
      timestamp: DateTime.now().setZone('America/Argentina/Buenos_Aires').toISO(),
      path: request.url,
    });
  }
}

