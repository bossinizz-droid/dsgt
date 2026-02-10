
export enum ItemCategory {
  ELECTRONICS = '전자제품',
  FURNITURE = '가구/인테리어',
  CLOTHING = '의류/잡화',
  BOOKS = '도서/취미',
  CAMPING = '캠핑/레저',
  TALENT = '재능기부',
  CEO_TREASURE = 'CEO 애장품'
}

export enum ItemCondition {
  S = 'S급 (미개봉/새상품)',
  A = 'A급 (사용감 적음)',
  B = 'B급 (사용감 있음)',
  C = 'C급 (기능 이상 없음)'
}

export enum DeliveryMethod {
  DIRECT = '대면/사내 락커',
  DELIVERY = '택배 배송'
}

export interface User {
  id: string;
  email: string;
  name: string;
  team: string;
  points: number;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  aiSuggestedPrice?: number;
  category: ItemCategory;
  condition: ItemCondition;
  deliveryMethod: DeliveryMethod;
  originAddress?: string;
  seller: string;
  team: string;
  imageUrls: string[];
  donationPercent: number;
  isAuction?: boolean;
  currentBid?: number;
  endsAt?: Date;
}

export interface DonationStats {
  totalAmount: number;
  treeEquivalents: number;
  beneficiariesCount: number;
  teamRankings: { team: string; amount: number }[];
}
