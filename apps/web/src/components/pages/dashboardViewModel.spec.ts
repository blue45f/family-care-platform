import { describe, expect, it } from 'vitest'

import { buildTodayWorkQueue } from './dashboardViewModel'

describe('buildTodayWorkQueue', () => {
  it('돌봄 기록, 정산, 보험청구 순서로 오늘 처리할 일을 만든다', () => {
    const tasks = buildTodayWorkQueue({
      scheduleCount: 0,
      careLogCount: 0,
      settlementCount: 0,
      pendingClaims: 3,
    })

    expect(tasks.map((task) => task.route)).toEqual([
      '/schedule',
      '/care',
      '/settlements',
      '/claims',
    ])
    expect(tasks[0]).toMatchObject({
      title: '오늘 방문 일정 만들기',
      tone: 'primary',
      route: '/schedule',
    })
    expect(tasks[3]).toMatchObject({
      title: '확인할 보험청구 3건',
      route: '/claims',
    })
  })

  it('이미 기록과 정산이 있으면 다음 점검 행동으로 문구를 낮춘다', () => {
    const tasks = buildTodayWorkQueue({
      scheduleCount: 2,
      careLogCount: 4,
      settlementCount: 2,
      pendingClaims: 0,
    })

    expect(tasks).toEqual([
      {
        title: '오늘 일정 확인',
        description: '방문 시간, 담당자, 취소된 일정이 없는지 먼저 확인하세요.',
        actionLabel: '일정 보기',
        route: '/schedule',
        icon: 'schedule',
        tone: 'secondary',
      },
      {
        title: '최근 돌봄 기록 확인',
        description: '누락된 방문·상담 내용이 없는지 살펴보세요.',
        actionLabel: '기록 보기',
        route: '/care',
        icon: 'care',
        tone: 'secondary',
      },
      {
        title: '이번 달 정산 검토',
        description: '가족별 정산액과 메모가 맞는지 확인하세요.',
        actionLabel: '정산 보기',
        route: '/settlements',
        icon: 'settlement',
        tone: 'secondary',
      },
      {
        title: '새 보험청구 준비',
        description: '새로 접수할 청구가 있으면 대상자와 기관을 등록하세요.',
        actionLabel: '청구 등록',
        route: '/claims',
        icon: 'claims',
        tone: 'secondary',
      },
    ])
  })
})
