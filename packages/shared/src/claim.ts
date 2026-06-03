import { z } from 'zod';

// 보험청구 도메인 계약 — web/api가 공유하는 상태 enum/스키마와 타입.
// 폼/입력 object 스키마(trim transform·optional 처리)는 앱별로 다르므로 로컬에 둔다.

// 정해진 청구 상태 목록(양쪽 schema가 동일하게 사용).
export const claimStatuses = ['요청', '검토중', '승인', '거절'] as const;

export type ClaimStatus = (typeof claimStatuses)[number];

const INVALID_STATUS_MESSAGE = '유효하지 않은 청구 상태입니다.';

// 청구 상태 enum 스키마. web 폼과 api @Body 검증이 동일 메시지로 공유한다.
export const claimStatusSchema = z.enum(claimStatuses, { error: INVALID_STATUS_MESSAGE });

export type Claim = {
  id: number;
  recipient: string;
  claimType: string;
  expectedAmount: number;
  hospitalName: string;
  issueDate: string;
  status: ClaimStatus;
  note: string;
};

// id를 제외한 입력 형태(api: ClaimInput, web: ClaimDraft).
export type ClaimInput = Omit<Claim, 'id'>;

export type ClaimStatusUpdate = {
  status: ClaimStatus;
};
