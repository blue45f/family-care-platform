import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import type { ArgumentMetadata } from '@nestjs/common'
import { ZodError, type ZodType } from 'zod'

// zod 검증 실패를 기존 if-throw와 동일한 BadRequestException으로 변환한다.
// 첫 이슈 메시지만 detail로 노출해 AllExceptionsFilter의 ApiErrorBody
// (error: 'BadRequest', statusCode: 400, detail: 메시지) 형태를 그대로 유지한다.
export function parseWithSchema<TOutput>(schema: ZodType<TOutput>, value: unknown): TOutput {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw zodErrorToBadRequest(result.error)
  }
  return result.data
}

export function zodErrorToBadRequest(error: ZodError): BadRequestException {
  const first = error.issues[0]
  return new BadRequestException(first?.message ?? '유효하지 않은 요청입니다.')
}

// NestJS 컨트롤러 경계에서 @Body()/@Param()을 스키마로 검증/정제하는 재사용 파이프.
@Injectable()
export class ZodValidationPipe<TOutput> implements PipeTransform {
  constructor(private readonly schema: ZodType<TOutput>) {}

  transform(value: unknown, _metadata: ArgumentMetadata): TOutput {
    return parseWithSchema(this.schema, value)
  }
}
