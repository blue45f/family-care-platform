export type Settlement = {
  id: number;
  recipient: string;
  date: string;
  careHours: number;
  baseRate: number;
  totalAmount: number;
  note: string;
};

export type SettlementInput = Omit<Settlement, 'id' | 'totalAmount'>;
