import type { ReactNode } from 'react'

export type TableColumn<Row> = {
  key: string
  header: ReactNode
  /** 셀 렌더. 모바일 스택 뷰에서는 header가 data-label로 노출된다. */
  cell: (row: Row) => ReactNode
  /** 우측 정렬 + tabular-nums(금액/숫자 컬럼). */
  numeric?: boolean
}

type TableProps<Row> = {
  columns: TableColumn<Row>[]
  rows: Row[]
  rowKey: (row: Row, index: number) => string
  caption?: ReactNode
  /** 모바일(<48rem)에서 행을 카드로 접는다. 기본 true. */
  stackOnMobile?: boolean
}

/**
 * 반응형 테이블: 데스크톱은 일반 표, 모바일에서는 행이 라벨-값 카드로 접힌다.
 * data-label은 모바일 스택 뷰에서 header를 셀 앞에 표시하는 데 쓰인다.
 */
export const Table = <Row,>({
  columns,
  rows,
  rowKey,
  caption,
  stackOnMobile = true,
}: TableProps<Row>) => (
  <div className="table-wrap">
    <table className={['table', stackOnMobile ? 'table-stack' : ''].filter(Boolean).join(' ')}>
      {caption ? <caption className="sr-only">{caption}</caption> : null}
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} scope="col">
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={rowKey(row, index)}>
            {columns.map((col) => (
              <td
                key={col.key}
                data-label={typeof col.header === 'string' ? col.header : undefined}
                className={col.numeric ? 'cell-num' : undefined}
              >
                {col.cell(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)
