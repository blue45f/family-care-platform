// 운영 목록(돌봄 기록/보험청구/정산)에서 공유하는 순수 검색·필터·정렬 헬퍼.
// operationsBreakdown.ts / dashboardViewModel.ts와 같은 컨벤션 — React 비의존 순수 함수라
// 단위 테스트가 쉽고 SSR 렌더에도 안전하다.
//
// 설계: 페이지마다 "검색어 + (선택)카테고리 + 정렬"이라는 동일한 동선을 갖는다. 각 페이지는
// 자기 도메인에 맞는 필드 셀렉터/정렬 비교자만 주입하고, 결합 로직(공백 정규화·대소문자 무시
// 부분일치·결정적 동률 처리)은 여기로 모은다.

/** 검색어 정규화: 앞뒤 공백 제거 + 소문자화. 빈 문자열이면 "필터 없음"을 뜻한다. */
export const normalizeQuery = (query: string): string => query.trim().toLowerCase()

/**
 * 행이 검색어에 매칭되는지 판정한다. `fields`는 행에서 끌어낸 검색 대상 문자열들이다.
 * 빈 검색어는 항상 매칭(true). 대소문자 무시 부분일치.
 */
export const matchesQuery = <Row>(
  row: Row,
  query: string,
  fields: (row: Row) => Array<string | null | undefined>
): boolean => {
  const normalized = normalizeQuery(query)
  if (normalized === '') {
    return true
  }
  return fields(row).some((value) => (value ?? '').toLowerCase().includes(normalized))
}

/** 정렬 방향 토글에 쓰는 두 방향. */
export type SortDirection = 'asc' | 'desc'

/**
 * 문자열 비교자(localeCompare). 동률이면 0을 반환하므로 호출부에서 안정적 2차 키를 덧댄다.
 */
export const compareStrings = (a: string, b: string, direction: SortDirection = 'asc'): number => {
  const result = a.localeCompare(b)
  return direction === 'asc' ? result : -result
}

/** 숫자 비교자. NaN/Infinity는 0으로 눌러 정렬이 깨지지 않게 한다(방어적). */
export const compareNumbers = (a: number, b: number, direction: SortDirection = 'asc'): number => {
  const safeA = Number.isFinite(a) ? a : 0
  const safeB = Number.isFinite(b) ? b : 0
  const result = safeA - safeB
  return direction === 'asc' ? result : -result
}

/**
 * 검색 + (선택)술어 필터 + 정렬을 한 번에 적용한다. 원본 배열은 변형하지 않는다(복사 후 정렬).
 *
 * - `search`: { query, fields } — 비어 있으면 검색을 건너뛴다.
 * - `predicate`: 추가 필터(상태/유형 칩 등). 생략 시 전체 통과.
 * - `compare`: 정렬 비교자. 생략 시 입력 순서를 보존한다.
 */
export const filterAndSort = <Row>(
  rows: readonly Row[],
  options: {
    search?: { query: string; fields: (row: Row) => Array<string | null | undefined> }
    predicate?: (row: Row) => boolean
    compare?: (a: Row, b: Row) => number
  } = {}
): Row[] => {
  const { search, predicate, compare } = options

  let result = rows.filter((row) => {
    if (predicate && !predicate(row)) {
      return false
    }
    if (search && !matchesQuery(row, search.query, search.fields)) {
      return false
    }
    return true
  })

  if (compare) {
    result = [...result].sort(compare)
  }

  return result
}
