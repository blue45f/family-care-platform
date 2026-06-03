// 돌봄 기록 도메인 계약 — web/api 양쪽이 공유하는 enum 리터럴과 타입.
// 폼/입력 object 스키마는 양쪽 검증 동작이 의도적으로 다르므로 각 앱에 로컬로 둔다.

// 정해진 돌봄 활동 유형 목록(양쪽 schema가 동일하게 사용).
export const careLogTypes = ['방문', '원격상담', '투약', '식사관리', '기타'] as const;

export type CareLogType = (typeof careLogTypes)[number];

export type CareLog = {
  id: number;
  recipient: string;
  caregiver: string;
  type: CareLogType;
  date: string;
  note: string;
};

// id를 제외한 입력 형태(api: CareLogInput, web: CareLogDraft).
export type CareLogInput = Omit<CareLog, 'id'>;
