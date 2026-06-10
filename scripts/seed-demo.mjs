#!/usr/bin/env node
// 데모 스토어 시드 스크립트 — HTTP API만 사용해 현실적인 한국어 데모 데이터를 채운다.
//
// 사용법:
//   node scripts/seed-demo.mjs
//
// 환경 변수(선택):
//   API_BASE       기본 https://familycare.3.107.235.143.nip.io/api
//   DEMO_EMAIL     기본 demo@familycare.app
//   DEMO_PASSWORD  기본 demo-1234
//
// 동작:
//   1) POST /auth/login 으로 토큰 발급 → 이후 모든 요청에 Authorization: Bearer 부착
//   2) 컬렉션별 GET 으로 기존 건수 확인 — 5건 이상이면 해당 컬렉션 시드 생략(멱등성)
//   3) schedules 8건(예정/진행중/완료/취소 mix, PATCH /schedules/:id/status 로 상태 변경)
//      care-logs 10건(방문·원격상담·투약·식사관리·기타 mix, 최근 날짜)
//      settlements 6건(시간/단가 다양)
//      claims 6건(요청/검토중/승인/거절 mix, PATCH /claims/:id/status 로 상태 변경)
//
// 의존성 없음(Node 22 ESM + 전역 fetch). 파일 직접 쓰기 없음 — 오직 HTTP API.

const API_BASE = (process.env.API_BASE ?? 'https://familycare.3.107.235.143.nip.io/api').replace(
  /\/+$/,
  '',
)
const DEMO_EMAIL = process.env.DEMO_EMAIL ?? 'demo@familycare.app'
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'demo-1234'

// 컬렉션에 이미 이 건수 이상 있으면 시드를 생략한다.
const SKIP_THRESHOLD = 5

/** 오늘 기준 offsetDays 만큼 이동한 로컬 날짜를 YYYY-MM-DD 로 반환한다. */
function ymd(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** JSON API 호출 헬퍼. 실패 시 상태코드·서버 메시지를 담아 throw 한다. */
async function api(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const text = await response.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!response.ok) {
    const detail =
      data && typeof data === 'object'
        ? (data.detail ?? data.message ?? JSON.stringify(data))
        : String(data)
    throw new Error(`${method} ${path} → HTTP ${response.status}: ${detail}`)
  }
  return data
}

/** 컬렉션 기존 건수를 확인해 SKIP_THRESHOLD 이상이면 true(생략)를 반환한다. */
async function shouldSkip(path, label, token) {
  const items = await api(path, { token })
  const count = Array.isArray(items) ? items.length : 0
  if (count >= SKIP_THRESHOLD) {
    console.log(`[skip] ${label}: 이미 ${count}건 존재 → 시드 생략`)
    return true
  }
  console.log(`[seed] ${label}: 기존 ${count}건 → 시드 진행`)
  return false
}

// ── 시드 데이터 ──────────────────────────────────────────────────────────────
// 돌봄 대상(어르신): 김순자/이정호/박막례/최영수, 요양보호사: 박지은/한미영/정우성/김다혜

// 방문 일정 8건 — 오늘 기준 앞뒤로 분포. POST 는 '예정'으로 생성 후
// targetStatus 가 다르면 PATCH /schedules/:id/status 로 상태를 바꾼다.
const scheduleSeeds = [
  {
    recipient: '김순자',
    caregiver: '박지은',
    offset: 1,
    startTime: '09:00',
    endTime: '12:00',
    targetStatus: '예정',
    note: '주 2회 방문요양 — 혈압 체크 및 산책 동행',
  },
  {
    recipient: '이정호',
    caregiver: '정우성',
    offset: 2,
    startTime: '14:00',
    endTime: '16:00',
    targetStatus: '예정',
    note: '무릎 재활운동 보조, 다음 외래 일정 확인',
  },
  {
    recipient: '박막례',
    caregiver: '한미영',
    offset: 4,
    startTime: '10:00',
    endTime: '13:00',
    targetStatus: '예정',
    note: '치매 초기 — 인지활동 프로그램 진행 예정',
  },
  {
    recipient: '최영수',
    caregiver: '김다혜',
    offset: 0,
    startTime: '09:30',
    endTime: '11:30',
    targetStatus: '진행중',
    note: '오전 방문 — 아침 투약 확인 후 목욕 보조',
  },
  {
    recipient: '김순자',
    caregiver: '박지은',
    offset: -1,
    startTime: '13:00',
    endTime: '17:00',
    targetStatus: '완료',
    note: '점심 식사 보조 및 말벗, 특이사항 없음',
  },
  {
    recipient: '이정호',
    caregiver: '한미영',
    offset: -3,
    startTime: '09:00',
    endTime: '12:00',
    targetStatus: '완료',
    note: '당뇨 식단 점검 — 아침 혈당 132로 안정적',
  },
  {
    recipient: '박막례',
    caregiver: '김다혜',
    offset: -5,
    startTime: '10:00',
    endTime: '14:00',
    targetStatus: '완료',
    note: '주간보호센터 동행, 귀가 후 저녁 준비',
  },
  {
    recipient: '최영수',
    caregiver: '정우성',
    offset: -2,
    startTime: '15:00',
    endTime: '17:00',
    targetStatus: '취소',
    note: '보호자 요청으로 취소 — 가족 행사 참석',
  },
]

// 돌봄 기록 10건 — 최근 날짜, 활동 유형 mix(방문 3·원격상담 2·투약 2·식사관리 2·기타 1).
const careLogSeeds = [
  {
    recipient: '김순자',
    caregiver: '박지은',
    type: '방문',
    offset: 0,
    note: '오전 방문. 혈압 128/82, 컨디션 양호. 30분 산책 동행.',
  },
  {
    recipient: '최영수',
    caregiver: '김다혜',
    type: '투약',
    offset: 0,
    note: '아침 고혈압약·당뇨약 복용 확인. 잔여분 5일 — 처방전 갱신 필요.',
  },
  {
    recipient: '이정호',
    caregiver: '정우성',
    type: '방문',
    offset: -1,
    note: '재활운동 40분 진행. 무릎 통증 호소 줄어듦.',
  },
  {
    recipient: '박막례',
    caregiver: '한미영',
    type: '식사관리',
    offset: -1,
    note: '점심 저염식 제공. 식사량 80%, 수분 섭취 충분.',
  },
  {
    recipient: '김순자',
    caregiver: '박지은',
    type: '원격상담',
    offset: -2,
    note: '보호자 전화 상담 15분 — 야간 수면 패턴 공유, 특이사항 없음.',
  },
  {
    recipient: '최영수',
    caregiver: '정우성',
    type: '식사관리',
    offset: -3,
    note: '저녁 당뇨 식단 점검. 간식 섭취 줄이도록 안내.',
  },
  {
    recipient: '박막례',
    caregiver: '김다혜',
    type: '투약',
    offset: -4,
    note: '치매약 저녁 복용 확인. 복용 거부 없었음.',
  },
  {
    recipient: '이정호',
    caregiver: '한미영',
    type: '원격상담',
    offset: -5,
    note: '영상통화 상태 확인 — 기침 완화, 다음 방문 때 체온 재확인 예정.',
  },
  {
    recipient: '김순자',
    caregiver: '박지은',
    type: '방문',
    offset: -6,
    note: '정기 방문. 목욕 보조 및 침구 교체, 욕창 징후 없음.',
  },
  {
    recipient: '최영수',
    caregiver: '김다혜',
    type: '기타',
    offset: -8,
    note: '복지관 경로식당 이용 신청서 작성 지원.',
  },
]

// 정산 6건 — 돌봄 시간/기본 단가 다양화(totalAmount 는 서버가 계산).
const settlementSeeds = [
  {
    recipient: '김순자',
    offset: -2,
    careHours: 4,
    baseRate: 15000,
    note: '이번 주 방문요양 정산(주 2회 중 1회차)',
  },
  {
    recipient: '이정호',
    offset: -4,
    careHours: 6,
    baseRate: 14000,
    note: '재활 보조 포함 주간 정산',
  },
  {
    recipient: '박막례',
    offset: -7,
    careHours: 8,
    baseRate: 16500,
    note: '주간보호 동행 포함 정산',
  },
  {
    recipient: '최영수',
    offset: -9,
    careHours: 3,
    baseRate: 13000,
    note: '오전 단기 방문 정산',
  },
  {
    recipient: '김순자',
    offset: -12,
    careHours: 5.5,
    baseRate: 15000,
    note: '지난주 방문요양 정산',
  },
  {
    recipient: '이정호',
    offset: -15,
    careHours: 2,
    baseRate: 18000,
    note: '야간 긴급 방문 — 할증 단가 적용',
  },
]

// 보험청구 6건 — POST 는 '요청'으로 생성 후, targetStatus 가 다르면
// PATCH /claims/:id/status 로 검토중/승인/거절 mix 를 만든다.
const claimSeeds = [
  {
    recipient: '김순자',
    claimType: '요양급여',
    expectedAmount: 480000,
    hospitalName: '서울아산병원',
    offset: -1,
    targetStatus: '요청',
    note: '이번 달 방문요양 본인부담금 청구',
  },
  {
    recipient: '최영수',
    claimType: '통원치료비',
    expectedAmount: 126000,
    hospitalName: '강남베드로의원',
    offset: -2,
    targetStatus: '요청',
    note: '물리치료 6회 통원 영수증 첨부',
  },
  {
    recipient: '이정호',
    claimType: '약제비',
    expectedAmount: 89000,
    hospitalName: '연세세브란스병원',
    offset: -5,
    targetStatus: '검토중',
    note: '당뇨약 처방 변경분 — 약국 영수증 2건',
  },
  {
    recipient: '박막례',
    claimType: '입원비',
    expectedAmount: 1540000,
    hospitalName: '서울성모병원',
    offset: -9,
    targetStatus: '승인',
    note: '폐렴 입원 5일 — 진단서·진료비 세부내역서 제출 완료',
  },
  {
    recipient: '김순자',
    claimType: '검진비',
    expectedAmount: 220000,
    hospitalName: '하나로의료재단',
    offset: -14,
    targetStatus: '승인',
    note: '연 1회 종합검진 — 보험사 접수번호 H-0412',
  },
  {
    recipient: '이정호',
    claimType: '재활치료비',
    expectedAmount: 310000,
    hospitalName: '바른재활의학과의원',
    offset: -18,
    targetStatus: '거절',
    note: '도수치료 10회 — 비급여 보장 제외로 거절(재청구 예정)',
  },
]

// ── 컬렉션별 시드 ────────────────────────────────────────────────────────────

async function seedSchedules(token) {
  if (await shouldSkip('/schedules', '방문 일정(schedules)', token)) return

  for (const seed of scheduleSeeds) {
    const { offset, targetStatus, ...rest } = seed
    const created = await api('/schedules', {
      method: 'POST',
      token,
      body: { ...rest, date: ymd(offset), status: '예정' },
    })
    let statusLabel = '예정'
    if (targetStatus !== '예정') {
      const updated = await api(`/schedules/${created.id}/status`, {
        method: 'PATCH',
        token,
        body: { status: targetStatus },
      })
      statusLabel = updated.status
    }
    console.log(
      `  + 일정 #${created.id} ${created.date} ${created.startTime}~${created.endTime} ${created.recipient} (${statusLabel})`,
    )
  }
}

async function seedCareLogs(token) {
  if (await shouldSkip('/care-logs', '돌봄 기록(care-logs)', token)) return

  for (const seed of careLogSeeds) {
    const { offset, ...rest } = seed
    const created = await api('/care-logs', {
      method: 'POST',
      token,
      body: { ...rest, date: ymd(offset) },
    })
    console.log(`  + 기록 #${created.id} ${created.date} [${created.type}] ${created.recipient}`)
  }
}

async function seedSettlements(token) {
  if (await shouldSkip('/settlements', '정산(settlements)', token)) return

  for (const seed of settlementSeeds) {
    const { offset, ...rest } = seed
    const created = await api('/settlements', {
      method: 'POST',
      token,
      body: { ...rest, date: ymd(offset) },
    })
    console.log(
      `  + 정산 #${created.id} ${created.date} ${created.recipient} ${created.careHours}h × ${created.baseRate.toLocaleString('ko-KR')}원 = ${created.totalAmount.toLocaleString('ko-KR')}원`,
    )
  }
}

async function seedClaims(token) {
  if (await shouldSkip('/claims', '보험청구(claims)', token)) return

  for (const seed of claimSeeds) {
    const { offset, targetStatus, ...rest } = seed
    const created = await api('/claims', {
      method: 'POST',
      token,
      body: { ...rest, issueDate: ymd(offset), status: '요청' },
    })
    let statusLabel = '요청'
    if (targetStatus !== '요청') {
      const updated = await api(`/claims/${created.id}/status`, {
        method: 'PATCH',
        token,
        body: { status: targetStatus },
      })
      statusLabel = updated.status
    }
    console.log(
      `  + 청구 #${created.id} ${created.issueDate} ${created.recipient} ${created.claimType} ${created.expectedAmount.toLocaleString('ko-KR')}원 (${statusLabel})`,
    )
  }
}

// ── 실행 ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('■ family-care 데모 시드 시작')
  console.log(`  API_BASE   = ${API_BASE}`)
  console.log(`  DEMO_EMAIL = ${DEMO_EMAIL}`)
  console.log('')

  const auth = await api('/auth/login', {
    method: 'POST',
    body: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
  })
  const token = auth?.token
  if (!token) {
    throw new Error('로그인 응답에 token이 없습니다.')
  }
  console.log(`로그인 성공: ${auth.user?.name ?? DEMO_EMAIL} (role: ${auth.user?.role ?? '?'})`)
  console.log('')

  await seedSchedules(token)
  await seedCareLogs(token)
  await seedSettlements(token)
  await seedClaims(token)

  console.log('')
  console.log('■ 최종 컬렉션 건수')
  for (const [path, label] of [
    ['/schedules', '방문 일정'],
    ['/care-logs', '돌봄 기록'],
    ['/settlements', '정산'],
    ['/claims', '보험청구'],
  ]) {
    const items = await api(path, { token })
    console.log(`  ${label.padEnd(5, ' ')}: ${Array.isArray(items) ? items.length : 0}건`)
  }
  console.log('')
  console.log('완료 — 대시보드를 새로고침해 확인하세요.')
}

main().catch((error) => {
  console.error('')
  console.error(`시드 실패: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
