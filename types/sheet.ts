export type SheetSummary = {
  createdAt: string;
  id: string;
  name: string;
  originalFileName: string;
  recordCount: number;
};

export type SheetRecordStatus = '미신청' | '신고완료' | '차단완료';

export type SheetRecord = {
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
