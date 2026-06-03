import { describe, expect, it } from 'vitest';

import { SettlementService } from './settlement.service';

describe('SettlementService', () => {
  it('정산합계를 포함해 정산 항목을 생성한다', () => {
    const service = new SettlementService();
    const created = service.create({
      recipient: '  이보호자 ',
      date: '2025-02-01',
      careHours: 2,
      baseRate: 50000,
      note: '  방문수행 ',
    });

    expect(created.totalAmount).toBe(100000);
    expect(created.recipient).toBe('이보호자');
    expect(created.note).toBe('방문수행');
  });

  it('careHours 또는 baseRate가 0 이하면 예외를 던진다', () => {
    const service = new SettlementService();

    expect(() =>
      service.create({
        recipient: '김보호자',
        date: '2025-02-01',
        careHours: 0,
        baseRate: 10000,
        note: '',
      }),
    ).toThrow('careHours와 baseRate는 0보다 커야 합니다.');
  });
});
