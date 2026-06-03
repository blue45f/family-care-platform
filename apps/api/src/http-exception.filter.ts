import {
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import type { ArgumentsHost } from '@nestjs/common'
import type { Response } from 'express'
import type { Request } from 'express'

type ApiErrorBody = {
  error: string
  detail: string
  statusCode: number
  path?: string
  timestamp: string
}

function stringifyErrorDetail(input: unknown): string {
  if (typeof input === 'string') {
    return input
  }

  if (input === null || input === undefined) {
    return '요청 처리 중 오류가 발생했습니다.'
  }

  if (typeof input === 'number' || typeof input === 'boolean') {
    return String(input)
  }

  if (Array.isArray(input)) {
    return input
      .map((item) => stringifyErrorDetail(item))
      .filter(Boolean)
      .join(', ')
  }

  if (typeof input === 'object') {
    const message = (input as { message?: unknown })?.message
    if (message !== undefined) {
      return stringifyErrorDetail(message)
    }

    return JSON.stringify(input)
  }

  return '요청 처리 중 오류가 발생했습니다.'
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request & { originalUrl?: string }>()
    const path = request?.originalUrl ?? request?.url

    const isHttpException = exception instanceof HttpException
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    const errorResponse = isHttpException ? exception.getResponse() : undefined
    const rawDetail =
      isHttpException && typeof errorResponse !== 'undefined'
        ? errorResponse
        : exception instanceof Error
          ? exception.message
          : '처리 중 예상치 못한 오류가 발생했습니다.'
    const detail = stringifyErrorDetail(rawDetail)

    const body: ApiErrorBody = {
      error: this.resolveErrorName(isHttpException ? exception : undefined),
      detail,
      statusCode: status,
      path,
      timestamp: new Date().toISOString(),
    }

    const safeErrorCode = status >= 500 ? '[server]' : '[client]'
    this.logger.error(
      `${safeErrorCode} ${status} ${request?.method ?? ''} ${path} - ${detail}`,
      exception instanceof Error ? exception.stack : undefined,
    )

    response.status(status).json(body)
  }

  private resolveErrorName(exception: HttpException | undefined): string {
    if (!exception) {
      return 'InternalServerError'
    }

    if (exception instanceof BadRequestException) {
      return 'BadRequest'
    }

    const response = exception.getResponse()
    if (typeof response === 'object' && response && 'error' in response) {
      return String(response.error)
    }

    return exception.name
  }
}
