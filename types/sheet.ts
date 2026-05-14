export type SheetSummary = {
  createdAt: string;
  customerEmail: string;
  customerId: string;
  customerName: string;
  deletionScheduledAt: string;
  deletionStatusLabel: string;
  daysUntilDeletion: number;
  id: string;
  isMatched: boolean;
  name: string;
  originalFileName: string;
  recordCount: number;
  retentionDays: number;
};

export type SheetRecordStatus = '미신청' | '신고완료' | '차단완료';

export type SheetRecord = {
  blockApproval: string;
  blockObjection: string;
  blockObjectionDecision: string;
  blockObjectionReason: string;
  blockReapproval: string;
  blockRejectionReason: string;
  blockReport: string;
  blockRereport: string;
  blockRereportRejectionReason: string;
  category: string;
  companyName: string;
  createdAt: string;
  displayDate: string;
  id: string;
  imageUrl: string;
  platform: string;
  price: string;
  productName: string;
  salesCount: number;
  salesUrl: string;
  searchDate: string;
  sheetId: string;
  status: SheetRecordStatus;
};
