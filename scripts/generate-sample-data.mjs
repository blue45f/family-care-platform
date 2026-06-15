#!/usr/bin/env node
// 로컬 샘플 데이터 생성기 — apps/api/data/*.json(파일 스토어 시드 소스)을 현실적인
// 한국어 돌봄 운영 데이터로 채운다. 결과 파일은 `pnpm --dir apps/api db:seed`가
// collections 테이블로 적재한다(또는 파일 백엔드가 그대로 사용).
//
// 특징
// - 서버/DB 불필요(node:fs + node:crypto만). 결정적(seed 고정)이라 재실행해도 동일 산출.
// - 날짜는 오늘(로컬) 기준 상대 오프셋으로 계산해 대시보드의 "이번 달" 지표가 항상 채워진다.
// - data/ 는 gitignore 대상이라 커밋되지 않는다.
//
// 사용법: node scripts/generate-sample-data.mjs

import { mkdirSync, writeFileSync } from 'node:fs'
import { scryptSync } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'apps', 'api', 'data')

// ── 헬퍼 ─────────────────────────────────────────────────────────────────────

/** 오늘 기준 offsetDays 이동한 로컬 날짜를 YYYY-MM-DD로 반환. */
function ymd(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 오늘 기준 offsetDays 이동한 ISO 타임스탬프(시:분 고정 가능). */
function iso(offsetDays = 0, hour = 9, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

// password.util.ts와 동일한 "salt:hash"(scrypt, hex:hex) 형식. 결정적 시드를 위해
// 고정 salt를 쓴다(로컬 데모 한정 — 운영 가입 경로는 randomBytes salt를 쓴다).
function hashPassword(plain, salt) {
  const derived = scryptSync(plain, salt, 64).toString('hex')
  return `${salt}:${derived}`
}

function writeCollection(file, items, seq) {
  const payload = seq === undefined ? { items } : { items, seq }
  writeFileSync(join(DATA_DIR, file), `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  console.log(`✓ ${file.padEnd(28)} ${items.length}건${seq === undefined ? '' : ` (seq=${seq})`}`)
}

// ── 사용자(users) ────────────────────────────────────────────────────────────
// 데모 관리자 + 운영자 + 보호자/요양보호사 계정으로 회원관리 화면에 폭을 준다.
// 비밀번호는 모두 `<role>-1234` 규칙(데모 관리자만 demo-1234).

const userSeeds = [
  {
    name: '데모 관리자',
    email: 'demo@familycare.app',
    pw: 'demo-1234',
    role: 'admin',
    org: '가족돌봄 운영센터',
    salt: 'a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1',
    offset: -40,
  },
  {
    name: '윤서연',
    email: 'seoyeon@familycare.app',
    pw: 'operator-1234',
    role: 'admin',
    org: '가족돌봄 운영센터',
    salt: 'b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2',
    offset: -35,
  },
  {
    name: '박지은',
    email: 'jieun@familycare.app',
    pw: 'operator-1234',
    role: 'operator',
    org: '강남방문요양센터',
    salt: 'c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3',
    offset: -30,
  },
  {
    name: '한미영',
    email: 'miyoung@familycare.app',
    pw: 'operator-1234',
    role: 'operator',
    org: '강남방문요양센터',
    salt: 'd4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4',
    offset: -28,
  },
  {
    name: '정우성',
    email: 'woosung@familycare.app',
    pw: 'operator-1234',
    role: 'operator',
    org: '서초실버케어',
    salt: 'e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5',
    offset: -25,
  },
  {
    name: '김다혜',
    email: 'dahye@familycare.app',
    pw: 'operator-1234',
    role: 'operator',
    org: '서초실버케어',
    salt: 'f6f6f6f6f6f6f6f6f6f6f6f6f6f6f6f6',
    offset: -20,
  },
  {
    name: '이정호',
    email: 'jeongho@guardian.app',
    pw: 'guardian-1234',
    role: 'operator',
    org: '',
    salt: '0707070707070707070707070707070a',
    offset: -14,
  },
  {
    name: '최보호',
    email: 'family@guardian.app',
    pw: 'guardian-1234',
    role: 'operator',
    org: '',
    salt: '0808080808080808080808080808080b',
    offset: -7,
    suspended: true,
  },
]

const users = userSeeds.map((u, i) => ({
  id: i + 1,
  email: u.email,
  name: u.name,
  passwordHash: hashPassword(u.pw, u.salt),
  role: u.role,
  createdAt: ymd(u.offset),
  ...(u.org ? { organization: u.org } : {}),
  ...(u.suspended ? { suspended: true } : {}),
}))

// ── 공통 마스터 데이터 ───────────────────────────────────────────────────────
const recipients = ['김순자', '이정호', '박막례', '최영수', '정말순', '오금자']
const caregivers = ['박지은', '한미영', '정우성', '김다혜']

// ── 돌봄 기록(care-logs) ─────────────────────────────────────────────────────
const careLogTypes = ['방문', '원격상담', '투약', '식사관리', '기타']
const careNoteByType = {
  방문: [
    '오전 방문. 혈압 128/82, 컨디션 양호. 30분 산책 동행.',
    '정기 방문. 목욕 보조 및 침구 교체, 욕창 징후 없음.',
    '재활운동 40분 진행. 무릎 통증 호소 줄어듦.',
    '오후 방문 — 거실 정리·세탁 보조, 기분 안정적.',
  ],
  원격상담: [
    '보호자 전화 상담 15분 — 야간 수면 패턴 공유, 특이사항 없음.',
    '영상통화 상태 확인 — 기침 완화, 다음 방문 때 체온 재확인 예정.',
    '복약 알림 일정 재확인, 약 잔여분 점검 안내.',
  ],
  투약: [
    '아침 고혈압약·당뇨약 복용 확인. 잔여분 5일 — 처방전 갱신 필요.',
    '치매약 저녁 복용 확인. 복용 거부 없었음.',
    '소염진통제 식후 복용 확인, 위장 불편감 없음.',
  ],
  식사관리: [
    '점심 저염식 제공. 식사량 80%, 수분 섭취 충분.',
    '저녁 당뇨 식단 점검. 간식 섭취 줄이도록 안내.',
    '연하곤란 대비 죽식 제공, 흡인 징후 없음.',
  ],
  기타: [
    '복지관 경로식당 이용 신청서 작성 지원.',
    '장기요양 등급 갱신 서류 준비 안내.',
    '보청기 점검 동행 및 건전지 교체.',
  ],
}

const careLogs = []
{
  let id = 1
  // 28건: recipient×type 조합을 최근 28일에 분포.
  for (let day = 0; day < 28; day++) {
    const recipient = recipients[day % recipients.length]
    const caregiver = caregivers[day % caregivers.length]
    const type = careLogTypes[day % careLogTypes.length]
    const notes = careNoteByType[type]
    careLogs.push({
      id: id++,
      recipient,
      caregiver,
      type,
      date: ymd(-day),
      note: notes[day % notes.length],
    })
  }
}

// ── 방문 일정(schedules) ─────────────────────────────────────────────────────
const scheduleStatuses = ['예정', '진행중', '완료', '취소']
const scheduleNotes = [
  '주 2회 방문요양 — 혈압 체크 및 산책 동행',
  '무릎 재활운동 보조, 다음 외래 일정 확인',
  '치매 초기 — 인지활동 프로그램 진행',
  '오전 방문 — 아침 투약 확인 후 목욕 보조',
  '점심 식사 보조 및 말벗, 특이사항 없음',
  '당뇨 식단 점검 — 아침 혈당 안정적',
  '주간보호센터 동행, 귀가 후 저녁 준비',
  '보호자 요청으로 일정 조정',
]
const timeSlots = [
  ['09:00', '12:00'],
  ['10:00', '13:00'],
  ['13:00', '17:00'],
  ['14:00', '16:00'],
  ['09:30', '11:30'],
  ['15:00', '17:00'],
]

const schedules = []
{
  let id = 1
  // 24건: 오늘 기준 +5 ~ -18일 분포. 미래=예정, 오늘=진행중, 과거=완료(일부 취소).
  for (let i = 0; i < 24; i++) {
    const offset = 5 - i // +5 ... -18
    const [startTime, endTime] = timeSlots[i % timeSlots.length]
    let status
    if (offset > 0) status = '예정'
    else if (offset === 0) status = '진행중'
    else status = i % 7 === 0 ? '취소' : '완료'
    schedules.push({
      id: id++,
      recipient: recipients[i % recipients.length],
      caregiver: caregivers[i % caregivers.length],
      date: ymd(offset),
      startTime,
      endTime,
      status,
      note: scheduleNotes[i % scheduleNotes.length],
    })
  }
}

// ── 정산(settlements) ────────────────────────────────────────────────────────
const settlementNotes = [
  '이번 주 방문요양 정산(주 2회 중 1회차)',
  '재활 보조 포함 주간 정산',
  '주간보호 동행 포함 정산',
  '오전 단기 방문 정산',
  '지난주 방문요양 정산',
  '야간 긴급 방문 — 할증 단가 적용',
]
const careHoursPool = [2, 3, 4, 5.5, 6, 8]
const baseRatePool = [13000, 14000, 15000, 16500, 18000]

const settlements = []
{
  let id = 1
  // 30건: 최근 60일에 분포(이번 달 + 지난달 지표 채움).
  for (let i = 0; i < 30; i++) {
    const careHours = careHoursPool[i % careHoursPool.length]
    const baseRate = baseRatePool[i % baseRatePool.length]
    settlements.push({
      id: id++,
      recipient: recipients[i % recipients.length],
      date: ymd(-(i * 2)),
      careHours,
      baseRate,
      totalAmount: Math.round(careHours * baseRate),
      note: settlementNotes[i % settlementNotes.length],
    })
  }
}

// ── 보험청구(claims) ─────────────────────────────────────────────────────────
const claimStatuses = ['요청', '검토중', '승인', '거절']
const claimTypes = ['요양급여', '통원치료비', '약제비', '입원비', '검진비', '재활치료비']
const hospitals = [
  '서울아산병원',
  '강남베드로의원',
  '연세세브란스병원',
  '서울성모병원',
  '하나로의료재단',
  '바른재활의학과의원',
]
const claimNotes = [
  '이번 달 방문요양 본인부담금 청구',
  '물리치료 6회 통원 영수증 첨부',
  '당뇨약 처방 변경분 — 약국 영수증 2건',
  '폐렴 입원 5일 — 진단서·진료비 세부내역서 제출 완료',
  '연 1회 종합검진 — 보험사 접수번호 H-0412',
  '도수치료 10회 — 비급여 보장 제외로 거절(재청구 예정)',
]
const claimAmounts = [480000, 126000, 89000, 1540000, 220000, 310000]

const claims = []
{
  let id = 1
  // 18건: 상태 mix(요청/검토중/승인/거절)를 균형 있게.
  for (let i = 0; i < 18; i++) {
    claims.push({
      id: id++,
      recipient: recipients[i % recipients.length],
      claimType: claimTypes[i % claimTypes.length],
      expectedAmount: claimAmounts[i % claimAmounts.length],
      hospitalName: hospitals[i % hospitals.length],
      issueDate: ymd(-(i * 3 + 1)),
      status: claimStatuses[i % claimStatuses.length],
      note: claimNotes[i % claimNotes.length],
    })
  }
}

// ── 쪽지(direct-messages) ────────────────────────────────────────────────────
// 운영자↔보호자 사이 짧은 대화 몇 건(읽음/안읽음 mix).
const directMessages = [
  {
    id: 1,
    senderId: 3,
    senderName: '박지은',
    recipientId: 7,
    recipientName: '이정호',
    body: '안녕하세요, 오늘 오전 방문 일정 9시로 확인됩니다. 도착 전 연락드릴게요.',
    createdAt: iso(-2, 8, 30),
    readAt: iso(-2, 8, 45),
  },
  {
    id: 2,
    senderId: 7,
    senderName: '이정호',
    recipientId: 3,
    recipientName: '박지은',
    body: '네 감사합니다. 어머니 혈압약 잔여분도 확인 부탁드려요.',
    createdAt: iso(-2, 9, 5),
    readAt: iso(-2, 9, 20),
  },
  {
    id: 3,
    senderId: 3,
    senderName: '박지은',
    recipientId: 7,
    recipientName: '이정호',
    body: '잔여분 5일치라 처방전 갱신 안내드렸습니다. 방문 기록에 남겨뒀어요.',
    createdAt: iso(-1, 11, 10),
    readAt: null,
  },
  {
    id: 4,
    senderId: 1,
    senderName: '데모 관리자',
    recipientId: 5,
    recipientName: '정우성',
    body: '이번 주 정산 내역 검토 후 금요일까지 마감 부탁드립니다.',
    createdAt: iso(-1, 14, 0),
    readAt: iso(-1, 15, 30),
  },
  {
    id: 5,
    senderId: 5,
    senderName: '정우성',
    recipientId: 1,
    recipientName: '데모 관리자',
    body: '확인했습니다. 야간 할증 건 1건 포함해서 정리 중입니다.',
    createdAt: iso(0, 10, 15),
    readAt: null,
  },
]

// ── 기록 ─────────────────────────────────────────────────────────────────────
mkdirSync(DATA_DIR, { recursive: true })
console.log(`■ 샘플 데이터 생성 → ${DATA_DIR}\n`)
writeCollection('users.json', users, users.length + 1)
writeCollection('care-logs.json', careLogs, careLogs.length + 1)
writeCollection('schedules.json', schedules, schedules.length + 1)
writeCollection('settlements.json', settlements, settlements.length + 1)
writeCollection('claims.json', claims, claims.length + 1)
writeCollection('direct-messages.json', directMessages, directMessages.length + 1)
console.log('\n완료. `pnpm --dir apps/api db:seed`로 DB에 적재하세요.')
