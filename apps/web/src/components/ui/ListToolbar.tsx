import { useId } from 'react'

import { Badge } from './Badge'
import { Select } from './Field'
import { Icon } from './Icon'

import type { ReactNode } from 'react'

/** 단일 선택 필터 칩 한 묶음(상태/유형 등). 빈 배열이면 칩 영역을 렌더하지 않는다. */
export type ListToolbarFilterOption<TValue extends string> = {
  value: TValue
  label: ReactNode
}

/** 정렬 옵션 한 묶음. 빈/생략이면 정렬 셀렉트를 렌더하지 않는다. */
export type ListToolbarSortOption<TValue extends string> = {
  value: TValue
  label: string
}

type ListToolbarProps<TFilter extends string, TSort extends string> = {
  /** 검색 입력 라벨(스크린리더). */
  searchLabel: string
  searchPlaceholder?: string
  searchValue: string
  onSearchChange: (value: string) => void

  /** 단일 선택 필터 칩(상태/유형). 생략 시 칩 영역 없음. */
  filterLabel?: string
  filterOptions?: ReadonlyArray<ListToolbarFilterOption<TFilter>>
  activeFilter?: TFilter
  onFilterChange?: (value: TFilter) => void

  /** 정렬 셀렉트. 생략 시 정렬 영역 없음. */
  sortLabel?: string
  sortOptions?: ReadonlyArray<ListToolbarSortOption<TSort>>
  sortValue?: TSort
  onSortChange?: (value: TSort) => void

  /**
   * 현재 필터 결과 요약(예: "전체 12건 중 3건"). 결과 수를 aria-live로 알린다.
   * 필터가 활성일 때만 의미가 있으므로 호출부에서 조건부로 넘긴다.
   */
  resultSummary?: ReactNode
  /** 필터가 하나라도 적용되어 있을 때 보여줄 "필터 초기화" 핸들러. */
  onClearFilters?: () => void
}

/**
 * 운영 목록(돌봄 기록/보험청구/정산) 공용 검색·필터·정렬 도구막대.
 * 커뮤니티 검색 도구막대와 동일한 시각 토큰(public-community-search/-filter)을 재사용하되,
 * 운영 목록 전용 레이아웃 래퍼(list-toolbar)로 정렬 셀렉트·결과 요약·초기화를 통합한다.
 */
export const ListToolbar = <TFilter extends string, TSort extends string>({
  searchLabel,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filterLabel,
  filterOptions,
  activeFilter,
  onFilterChange,
  sortLabel,
  sortOptions,
  sortValue,
  onSortChange,
  resultSummary,
  onClearFilters,
}: ListToolbarProps<TFilter, TSort>) => {
  const sortId = useId()
  const hasFilters = Boolean(filterOptions && filterOptions.length > 0)
  const hasSort = Boolean(sortOptions && sortOptions.length > 0)

  return (
    <div className="list-toolbar" role="search" aria-label={searchLabel}>
      <div className="list-toolbar-row">
        <input
          type="search"
          className="public-community-search list-toolbar-search"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label={searchLabel}
        />

        {hasSort ? (
          <div className="list-toolbar-sort">
            <label className="sr-only" htmlFor={sortId}>
              {sortLabel ?? '정렬 기준'}
            </label>
            <Select
              id={sortId}
              value={sortValue}
              aria-label={sortLabel ?? '정렬 기준'}
              onChange={(event) => onSortChange?.(event.target.value as TSort)}
            >
              {sortOptions?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
      </div>

      {hasFilters ? (
        <div className="public-community-filters" aria-label={filterLabel ?? '필터'}>
          {filterOptions?.map((option) => {
            const isActive = activeFilter === option.value
            return (
              <button
                type="button"
                key={option.value}
                className={`public-community-filter${isActive ? ' is-active' : ''}`}
                aria-pressed={isActive}
                onClick={() => {
                  if (!isActive) {
                    onFilterChange?.(option.value)
                  }
                }}
              >
                <Badge tone={isActive ? 'accent' : 'neutral'} plain>
                  {option.label}
                </Badge>
              </button>
            )
          })}
        </div>
      ) : null}

      {resultSummary || onClearFilters ? (
        <div className="list-toolbar-meta">
          {resultSummary ? (
            <p className="list-toolbar-summary" role="status" aria-live="polite">
              {resultSummary}
            </p>
          ) : (
            <span />
          )}
          {onClearFilters ? (
            <button type="button" className="card-link" onClick={onClearFilters}>
              <Icon name="close" size={14} />
              필터 초기화
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
