import type { AppRoute } from '../../routeConfig'
import type { IconName } from '../ui'

export type TodayWorkQueueInput = {
  scheduleCount: number
  careLogCount: number
  settlementCount: number
  pendingClaims: number
}

export type TodayWorkTask = {
  title: string
  description: string
  actionLabel: string
  route: AppRoute
  icon: IconName
  tone: 'primary' | 'secondary'
}

export const buildTodayWorkQueue = ({
  scheduleCount,
  careLogCount,
  settlementCount,
  pendingClaims,
}: TodayWorkQueueInput): TodayWorkTask[] => [
  scheduleCount === 0
    ? {
        title: '오늘 방문 일정 만들기',
        description: '방문 시간과 담당자를 먼저 정하면 기록과 정산 흐름이 안정됩니다.',
        actionLabel: '일정 등록',
        route: '/schedule',
        icon: 'schedule',
        tone: 'primary',
      }
    : {
        title: '오늘 일정 확인',
        description: '방문 시간, 담당자, 취소된 일정이 없는지 먼저 확인하세요.',
        actionLabel: '일정 보기',
        route: '/schedule',
        icon: 'schedule',
        tone: 'secondary',
      },
  careLogCount === 0
    ? {
        title: '오늘 돌봄 기록 남기기',
        description: '첫 방문·상담 내용을 남기면 정산과 청구 흐름이 이어집니다.',
        actionLabel: '기록 시작',
        route: '/care',
        icon: 'care',
        tone: 'primary',
      }
    : {
        title: '최근 돌봄 기록 확인',
        description: '누락된 방문·상담 내용이 없는지 살펴보세요.',
        actionLabel: '기록 보기',
        route: '/care',
        icon: 'care',
        tone: 'secondary',
      },
  settlementCount === 0
    ? {
        title: '돌봄비 정산 시작',
        description: '돌봄 시간과 시간당 금액을 입력해 가족별 정산액을 계산하세요.',
        actionLabel: '정산 계산',
        route: '/settlements',
        icon: 'settlement',
        tone: 'primary',
      }
    : {
        title: '이번 달 정산 검토',
        description: '가족별 정산액과 메모가 맞는지 확인하세요.',
        actionLabel: '정산 보기',
        route: '/settlements',
        icon: 'settlement',
        tone: 'secondary',
      },
  pendingClaims > 0
    ? {
        title: `확인할 보험청구 ${pendingClaims}건`,
        description: '요청·검토·거절 상태의 청구를 먼저 처리하세요.',
        actionLabel: '청구 확인',
        route: '/claims',
        icon: 'claims',
        tone: 'primary',
      }
    : {
        title: '새 보험청구 준비',
        description: '새로 접수할 청구가 있으면 대상자와 기관을 등록하세요.',
        actionLabel: '청구 등록',
        route: '/claims',
        icon: 'claims',
        tone: 'secondary',
      },
]
