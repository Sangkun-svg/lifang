import { isUserProduct, userProducts, type UserProduct } from './products';

export const productHistoryPageSize = 20;

export type ProductHistoryStatus = '미신청' | '신고완료' | '차단완료';

export type ProductHistoryItem = {
  blockApproval: string;
  blockObjection: string;
  blockObjectionDecision: string;
  blockObjectionReason: string;
  blockReapproval: string;
  blockRejectionReason: string;
  blockReport: string;
  blockRereport: string;
  blockRereportRejectionReason: string;
  blockRequested: boolean;
  companyName: string;
  displayDate: string;
  id: string;
  imageUrl: string;
  platform: string;
  price: string;
  product: UserProduct;
  productName: string;
  salesCount: number;
  salesUrl: string;
  searchDate: string;
  status: ProductHistoryStatus;
};

const statusCycle: ProductHistoryStatus[] = ['차단완료', '신고완료', '미신청', '차단완료', '차단완료'];
const platformCycle = ['1688', '타오바오', '알리익스프레스', '티몰'];
const productNameByProduct: Record<UserProduct, string> = {
  공룡: '跨境儿童纸质恐龙3D立体拼图动物模型拼装亚马逊玩具益智DIY手工',
  산타: '圣诞老人创意纸质立体拼图儿童手工节日装饰益智玩具',
  토끼: '儿童纸质兔子3D立体拼图动物模型拼装益智DIY手工',
  공룡2: '恐龙造型儿童立体拼图手工模型益智玩具套装',
  호랑이: '老虎动物模型纸质3D立体拼图儿童益智DIY手工',
};

function formatDisplayDate(value: string) {
  const [year, month, day] = value.split('-');

  if (!year || !month || !day) {
    return value;
  }

  return `${year.slice(2)}. ${month}. ${day}`;
}

function getSearchDate(_index: number) {
  return '2026-04-02';
}

function createProductHistory(product: UserProduct): ProductHistoryItem[] {
  return Array.from({ length: 73 }).map((_, index) => {
    const status = statusCycle[index % statusCycle.length];
    const searchDate = getSearchDate(index);
    const blockRequested = status !== '미신청';

    return {
      blockApproval: status === '차단완료' ? '승인 완료' : '-',
      blockObjection: '-',
      blockObjectionDecision: '-',
      blockObjectionReason: '-',
      blockReapproval: '-',
      blockRejectionReason: '-',
      blockReport: blockRequested ? '신고 완료' : '-',
      blockRereport: '-',
      blockRereportRejectionReason: '-',
      blockRequested,
      companyName: '汕头市澄海区宝比迪玩具有限公司',
      displayDate: formatDisplayDate(searchDate),
      id: `${product}-${String(index + 1).padStart(3, '0')}`,
      imageUrl: '/assets/product-sample.png',
      platform: platformCycle[index % platformCycle.length],
      price: (4.12 + (index % 6) * 0.18).toFixed(2),
      product,
      productName: productNameByProduct[product],
      salesCount: 50 + (index % 7) * 8,
      salesUrl: 'https://page.1688.com/shtml/static/wrongpage.html',
      searchDate,
      status,
    };
  });
}

export const productHistoryItems = userProducts.reduce(
  (items, product) => ({
    ...items,
    [product]: createProductHistory(product),
  }),
  {} as Record<UserProduct, ProductHistoryItem[]>
);

export function getProductFromParam(value: string | string[] | undefined): UserProduct {
  const paramValue = Array.isArray(value) ? value[0] : value;
  return isUserProduct(paramValue) ? paramValue : userProducts[0];
}

export function getProductHistoryItems(product: UserProduct) {
  return productHistoryItems[product];
}

export function getProductHistoryItem(product: UserProduct, itemId: string | string[] | undefined) {
  const normalizedItemId = Array.isArray(itemId) ? itemId[0] : itemId;

  if (!normalizedItemId) {
    return null;
  }

  return productHistoryItems[product].find((item) => item.id === normalizedItemId) ?? null;
}

export function filterProductHistoryItems(items: ProductHistoryItem[], startDate: string, endDate: string) {
  const normalizedStartDate = startDate <= endDate ? startDate : endDate;
  const normalizedEndDate = startDate <= endDate ? endDate : startDate;

  return items.filter((item) => item.searchDate >= normalizedStartDate && item.searchDate <= normalizedEndDate);
}
