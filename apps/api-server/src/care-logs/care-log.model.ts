export type CareLogType = '방문' | '원격상담' | '투약' | '식사관리' | '기타';

export type CareLog = {
  id: number;
  recipient: string;
  caregiver: string;
  type: CareLogType;
  date: string;
  note: string;
};

export type CareLogInput = Omit<CareLog, 'id'>;
