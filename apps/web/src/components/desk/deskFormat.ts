/**
 * DeskCloud 네이티브 카드 공용 포매터.
 * components/desk/** 는 boundaries 상 'shared' 라 domains 헬퍼를 가져올 수 없어,
 * 상대 시간 포맷을 여기(같은 shared 계층)에 둔다. 도메인의 동일 로직과 표기를 맞춘다.
 */

/** ISO 타임스탬프를 '방금 전 / N분 전 / N시간 전 / N일 전 / YYYY.MM.DD' 로 표기한다. */
export function formatRelativeTime(iso: string, baseline: number = Date.now()): string {
  const time = Date.parse(iso)
  if (Number.isNaN(time)) {
    return ''
  }
  const diffMs = Math.max(0, baseline - time)
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) {
    return '방금 전'
  }
  if (minutes < 60) {
    return `${minutes}분 전`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}시간 전`
  }
  const days = Math.floor(hours / 24)
  if (days < 30) {
    return `${days}일 전`
  }
  const date = new Date(time)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}.${month}.${day}`
}
