// 로컬 타임존 기준 날짜 헬퍼 (web/src/utils.ts의 localYmd/localMonthKey와 동일 동작).
// new Date().toISOString()은 UTC 기준이라 KST(UTC+9) 환경에서 00:00~09:00 사이에는
// yyyy-MM-dd / yyyy-MM가 하루(한 달) 밀린다. getFullYear/getMonth/getDate는 로컬
// 시간을 반환하므로 getRecentMonthKeys와 일관되게 로컬 기준 키를 만든다.
export const localYmd = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const localMonthKey = (d: Date = new Date()): string => localYmd(d).slice(0, 7);
