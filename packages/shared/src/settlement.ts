// 정산 도메인 계약 — web/api가 공유하는 타입.
// 폼/입력 object 스키마(trim transform·optional 처리)는 앱별로 달라 로컬에 둔다.

export type Settlement = {
  id: number
  recipient: string
  date: string
  careHours: number
  baseRate: number
  totalAmount: number
  note: string
}

// id/totalAmount를 제외한 입력 형태(api: SettlementInput, web: SettlementDraft).
export type SettlementInput = Omit<Settlement, 'id' | 'totalAmount'>
