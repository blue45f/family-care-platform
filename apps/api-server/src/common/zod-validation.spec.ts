import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { careLogInputSchema } from '../care-logs/care-log.schema';
import { claimIdParamSchema, claimInputSchema } from '../claims/claim.schema';
import { settlementInputSchema } from '../settlements/settlement.schema';
import { ZodValidationPipe, parseWithSchema } from './zod-validation.pipe';

describe('zod 검증 (스키마 + 파이프)', () => {
  it('careLogInputSchema는 필수 문자열을 trim하고 type을 정제한다', () => {
    const parsed = careLogInputSchema.parse({
      recipient: '  김보호자 ',
      caregiver: ' 박돌봄 ',
      type: '방문',
      date: '2025-01-01',
      note: ' 메모 ',
    });

    expect(parsed.recipient).toBe('김보호자');
    expect(parsed.caregiver).toBe('박돌봄');
    expect(parsed.note).toBe('메모');
  });

  it('careLogInputSchema는 잘못된 type을 거절한다', () => {
    const result = careLogInputSchema.safeParse({
      recipient: '김보호자',
      caregiver: '박돌봄',
      type: '식단',
      date: '2025-01-01',
      note: '메모',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('유효하지 않은 돌봄 활동 유형입니다.');
  });

  it('settlementInputSchema는 careHours/baseRate가 0 이하면 거절한다', () => {
    const result = settlementInputSchema.safeParse({
      recipient: '김보호자',
      date: '2025-02-01',
      careHours: 0,
      baseRate: 10000,
      note: '',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('careHours와 baseRate는 0보다 커야 합니다.');
  });

  it('claimInputSchema는 expectedAmount가 유한수가 아니거나 0 이하면 거절한다', () => {
    const base = {
      recipient: '홍보호자',
      claimType: '장기요양보험',
      hospitalName: '서울재활의료원',
      issueDate: '2025-03-01',
      status: '요청' as const,
      note: '',
    };

    for (const expectedAmount of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const result = claimInputSchema.safeParse({ ...base, expectedAmount });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe('expectedAmount는 0보다 큰 숫자여야 합니다.');
    }
  });

  it('claimIdParamSchema는 양의 정수 문자열만 통과시킨다', () => {
    expect(claimIdParamSchema.parse('5')).toBe(5);
    for (const bad of ['abc', '0', '1.5', '-2']) {
      const result = claimIdParamSchema.safeParse(bad);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe('유효하지 않은 청구 ID입니다.');
    }
  });

  it('parseWithSchema/ZodValidationPipe는 실패 시 BadRequestException(첫 메시지)을 던진다', () => {
    const schema = z.object({ name: z.string().min(1, '이름은 필수입니다.') });

    expect(() => parseWithSchema(schema, { name: '' })).toThrowError(BadRequestException);
    expect(() => parseWithSchema(schema, { name: '' })).toThrow('이름은 필수입니다.');

    const pipe = new ZodValidationPipe(schema);
    expect(pipe.transform({ name: 'ok' }, { type: 'body' })).toEqual({ name: 'ok' });
    expect(() => pipe.transform({ name: '' }, { type: 'body' })).toThrow('이름은 필수입니다.');
  });
});
