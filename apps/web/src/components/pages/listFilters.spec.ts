import { describe, expect, it } from 'vitest'

import {
  compareNumbers,
  compareStrings,
  filterAndSort,
  matchesQuery,
  normalizeQuery,
} from './listFilters'

type Row = { name: string; org: string; amount: number }

const rows: Row[] = [
  { name: '김영희', org: '희망요양', amount: 30000 },
  { name: '이정호', org: '행복센터', amount: 45000 },
  { name: '박순자', org: '희망요양', amount: 12000 },
]

describe('normalizeQuery', () => {
  it('앞뒤 공백을 제거하고 소문자화한다', () => {
    expect(normalizeQuery('  AbC ')).toBe('abc')
  })

  it('공백만 있으면 빈 문자열을 반환한다', () => {
    expect(normalizeQuery('   ')).toBe('')
  })
})

describe('matchesQuery', () => {
  const fields = (row: Row) => [row.name, row.org]

  it('빈 검색어는 항상 매칭한다', () => {
    expect(matchesQuery(rows[0], '', fields)).toBe(true)
    expect(matchesQuery(rows[0], '   ', fields)).toBe(true)
  })

  it('대소문자 무시 부분일치로 매칭한다', () => {
    expect(matchesQuery(rows[0], '영희', fields)).toBe(true)
    expect(matchesQuery(rows[0], '희망', fields)).toBe(true)
    expect(matchesQuery(rows[0], '행복', fields)).toBe(false)
  })

  it('null/undefined 필드를 안전하게 건너뛴다', () => {
    const sparse = { name: '홍길동', org: '' } as Row
    expect(matchesQuery(sparse, '길동', (row) => [row.name, undefined, null])).toBe(true)
  })
})

describe('compareStrings / compareNumbers', () => {
  it('문자열을 오름/내림으로 정렬한다', () => {
    expect(compareStrings('가', '나')).toBeLessThan(0)
    expect(compareStrings('가', '나', 'desc')).toBeGreaterThan(0)
  })

  it('숫자를 오름/내림으로 정렬한다', () => {
    expect(compareNumbers(1, 2)).toBeLessThan(0)
    expect(compareNumbers(1, 2, 'desc')).toBeGreaterThan(0)
  })

  it('NaN/Infinity는 0으로 눌러 정렬을 깨지 않는다', () => {
    expect(compareNumbers(Number.NaN, 0)).toBe(0)
    expect(compareNumbers(Number.POSITIVE_INFINITY, 0)).toBe(0)
  })
})

describe('filterAndSort', () => {
  it('옵션이 없으면 입력 순서를 그대로 반환한다', () => {
    expect(filterAndSort(rows)).toEqual(rows)
  })

  it('검색어로 거른다', () => {
    const result = filterAndSort(rows, {
      search: { query: '희망', fields: (row) => [row.name, row.org] },
    })
    expect(result.map((row) => row.name)).toEqual(['김영희', '박순자'])
  })

  it('술어 필터로 거른다', () => {
    const result = filterAndSort(rows, { predicate: (row) => row.amount >= 30000 })
    expect(result.map((row) => row.name)).toEqual(['김영희', '이정호'])
  })

  it('검색 + 술어 + 정렬을 함께 적용하고 원본을 변형하지 않는다', () => {
    const original = [...rows]
    const result = filterAndSort(rows, {
      search: { query: '희망', fields: (row) => [row.org] },
      compare: (a, b) => compareNumbers(a.amount, b.amount, 'desc'),
    })
    expect(result.map((row) => row.name)).toEqual(['김영희', '박순자'])
    expect(rows).toEqual(original)
  })

  it('정렬 비교자는 안정적이어야 동률에서 입력 순서를 보존한다', () => {
    const tie = filterAndSort(rows, {
      compare: (a, b) => compareStrings(a.org, b.org),
    })
    // 희망요양 둘(김영희, 박순자)은 입력 순서를 유지한다.
    expect(tie.map((row) => row.name)).toEqual(['이정호', '김영희', '박순자'])
  })
})
