export type ProductCategory =
  | 'vegetables'
  | 'fruits'
  | 'grains'
  | 'dairy'
  | 'equipment'
  | 'kirana'
  | 'handcrafts';

export type ProductUnit = 'kg' | 'quintal' | 'crate' | 'sack' | 'box' | 'liter' | 'piece';

export type MarketplaceProduct = {
  id: string;
  title: string;
  marathiTitle?: string;
  hindiTitle?: string;
  category: ProductCategory;
  price: number;
  unit: ProductUnit;
  quantityAvailable: number;
  imageUrl: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerVillage: string;
  district: string;
  description: string;
  isOrganic?: boolean;
  createdAt: string;
};

export type MarketplaceOrder = {
  id: string;
  productId: string;
  productTitle: string;
  quantity: number;
  unit: ProductUnit;
  unitPrice: number;
  totalPrice: number;
  buyerName: string;
  buyerPhone: string;
  deliveryAddress: string;
  status: 'confirmed' | 'dispatched' | 'delivered';
  orderedAt: string;
};

export type ListingDraft = {
  title: string;
  category: ProductCategory;
  price: number;
  unit: ProductUnit;
  quantity: number;
  suggestedPrice?: number;
  imageUrl?: string;
  description: string;
  isReady: boolean;
};

export type AgentChatMessage = {
  id: string;
  sender: 'agent' | 'user';
  text: string;
  suggestedQuickReplies?: string[];
  productDraft?: Partial<ListingDraft>;
};
