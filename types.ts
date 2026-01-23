
export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  isPurchased: boolean;
  isFavorite: boolean;
  createdAt: number;
  purchasedAt?: number;
}

export interface ShoppingList {
  id: string;
  title: string;
  ownerUid: string;
  sharedWith: string[];
  pendingInvites?: Record<string, { createdAt: number; expiresAt: number }>;
  createdAt: number;
  updatedAt: number;
}

export type Tab = 'list' | 'favorites';
