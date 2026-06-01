import { describe, expect, it } from 'vitest';

import { ClaimsService } from './claims.service';

describe('ClaimsService', () => {
  it('청구 항목을 생성하고 승인율 전환을 처리한다', () => {
    const service = new ClaimsService();
    const created = service.create({
      recipient: '홍보호자',
      claimType: '장기요양보험',
      expectedAmount: 120000,
      hospitalName: '서울재활의료원',
      issueDate: '2025-03-01',
      status: '요청',
      note: '초진 접수',
    });

    expect(created.status).toBe('요청');

    const updated = service.updateStatus(created.id, '승인');
    expect(updated.status).toBe('승인');
  });

  it('존재하지 않는 청구 id를 업데이트하면 예외를 던진다', () => {
    const service = new ClaimsService();

    expect(() => service.updateStatus(999, '승인')).toThrow('해당 보험청구를 찾을 수 없습니다.');
  });
});
