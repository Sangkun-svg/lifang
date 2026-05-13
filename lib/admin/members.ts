import type { Member } from '@/types/member';

const sheetUrl =
  'https://docs.google.com/spreadsheets/d/1fuRZWdWV3IkRiGQY82sh0OGGCmBkcA-c/edit?gid=45884231#gid=45884231';
const sheetNames = ['공룡', '산타', '토끼', '공룡2', '호랑이'];

export const adminMembers: Member[] = [
  {
    id: 'zerofee',
    createdAt: '26. 04. 02',
    createdAtDate: '2026-04-02',
    companyName: '제로피',
    managerName: '홍길동',
    email: 'contact@zerofee.kr',
    sheetLinks: [sheetUrl],
    sheetNames: ['공룡'],
  },
  {
    id: 'nocoders',
    createdAt: '26. 04. 02',
    createdAtDate: '2026-04-02',
    companyName: '(주)노코더스',
    managerName: '홍길동',
    email: 'move9@nocoders.kr',
    sheetLinks: [sheetUrl],
    sheetNames: ['산타'],
  },
  {
    id: 'lifang',
    createdAt: '26. 04. 02',
    createdAtDate: '2026-04-02',
    companyName: '리팡 외국자문법률사무소',
    managerName: '홍길동',
    email: 'khpark@lifang.kr',
    sheetLinks: [sheetUrl],
    sheetNames: ['토끼'],
  },
  ...Array.from({ length: 7 }, (_, index) => ({
    id: `sample-${index + 1}`,
    createdAt: '26. 04. 02',
    createdAtDate: '2026-04-02',
    companyName: '리팡 외국자문법률사무소',
    managerName: index % 2 === 0 ? '홍길동' : '공길동',
    email: 'honggildong@gmail.com',
    sheetLinks: index === 6 ? [sheetUrl, sheetUrl] : [sheetUrl],
    sheetNames: index === 6 ? ['공룡', '호랑이'] : [sheetNames[index % sheetNames.length]],
  })),
];

export function findAdminMember(memberId: string) {
  return adminMembers.find((member) => member.id === memberId) ?? adminMembers[0];
}
