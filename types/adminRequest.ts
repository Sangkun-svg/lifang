export type AdminRequestStatus = '신규요청' | '처리중' | '처리완료';

export type AdminRequest = {
  companyName: string;
  createdAt: string;
  id: string;
  itemId: string;
  message: string;
  platform: string;
  price: string;
  product: string;
  productName: string;
  requestType: string;
  salesCount: number;
  salesUrl: string;
  searchDate: string;
  status: AdminRequestStatus;
  userEmail: string;
  userId: string;
};
