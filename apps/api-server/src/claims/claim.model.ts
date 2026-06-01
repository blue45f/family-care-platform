export type ClaimStatus = '요청' | '검토중' | '승인' | '거절';

export type Claim = {
  id: number;
  recipient: string;
  claimType: string;
  expectedAmount: number;
  hospitalName: string;
  issueDate: string;
  status: ClaimStatus;
  note: string;
};

export type ClaimInput = Omit<Claim, 'id'>;

export type ClaimStatusUpdate = {
  status: ClaimStatus;
};
