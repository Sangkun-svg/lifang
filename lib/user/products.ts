export const userProducts = ['공룡', '산타', '토끼', '공룡2', '호랑이'] as const;

export type UserProduct = (typeof userProducts)[number];

export function isUserProduct(value: string | undefined): value is UserProduct {
  return typeof value === 'string' && userProducts.includes(value as UserProduct);
}
