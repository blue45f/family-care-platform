import type { AdminMonthlyTrendDataSource, ClaimStatus } from './types';

export type TrendDeltaDirection = 'up' | 'down' | 'flat';

export type TrendMetricDeltaValue = {
  delta: number;
  deltaRate: number;
  direction: TrendDeltaDirection;
};

export const TREND_SOURCE_SERVER: AdminMonthlyTrendDataSource = 'server';
export const TREND_SOURCE_FALLBACK: AdminMonthlyTrendDataSource = 'client-fallback';

// 로컬 타임존 기준 날짜 헬퍼.
// new Date().toISOString()은 UTC 기준이라 KST(UTC+9) 사용자가 00:00~09:00 사이에
// 사용하면 yyyy-MM-dd / yyyy-MM가 하루(한 달) 밀린다. getFullYear/getMonth/getDate는
// 로컬 시간을 반환하므로 buildMonthKeys와 일관되게 로컬 기준 키를 만든다.
export const localYmd = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const localMonthKey = (d: Date = new Date()): string => localYmd(d).slice(0, 7);

export const roundMoney = (value: number) => (Number.isFinite(value) ? Math.round(value) : 0);
export const formatWon = (value: number) => `${roundMoney(value).toLocaleString()}원`;
export const formatRate = (value: number) => `${Number.isFinite(value) ? value.toFixed(1) : '0.0'}%`;
export const formatSignedRate = (value: number) => {
  if (!Number.isFinite(value)) {
    return '0.0%';
  }
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
};
export const formatSignedRatePoint = (value: number) => {
  if (!Number.isFinite(value)) {
    return '0.0pt';
  }
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}pt`;
};
export const formatSignedWon = (value: number) => {
  const rounded = roundMoney(value);
  return `${rounded > 0 ? '+' : ''}${rounded.toLocaleString()}원`;
};
export const formatMonthLabel = (month: string) => {
  const [, monthNumber] = month.split('-');
  return `${monthNumber}월`;
};

export const claimStatusClass = (status: ClaimStatus) => {
  switch (status) {
    case '요청':
      return 'status-request';
    case '검토중':
      return 'status-review';
    case '승인':
      return 'status-approved';
    case '거절':
      return 'status-rejected';
    default:
      return 'status-request';
  }
};

export const trendDirectionClass = (value: number): TrendDeltaDirection => {
  if (value > 0) {
    return 'up';
  }
  if (value < 0) {
    return 'down';
  }
  return 'flat';
};

export const trendDirectionLabel = (direction: TrendDeltaDirection) => {
  if (direction === 'up') {
    return '상승';
  }
  if (direction === 'down') {
    return '하락';
  }
  return '동일';
};

export const calculateTrendDelta = (current: number, previous: number): TrendMetricDeltaValue => {
  const delta = current - previous;
  const deltaRate = previous === 0 ? (delta > 0 ? 100 : 0) : Number(((delta / previous) * 100).toFixed(1));

  return {
    delta,
    deltaRate,
    direction: trendDirectionClass(delta),
  };
};
