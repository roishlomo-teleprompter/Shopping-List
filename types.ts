export type CategoryKey =
  | "vegetables_fruits"
  | "dairy_eggs"
  | "meat_fish"
  | "bakery_bread"
  | "other";

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  isPurchased: boolean;
  isFavorite: boolean;
  createdAt: number;
  purchasedAt?: number;
  category?: CategoryKey; // ← שדה אחד בלבד
  
  addedByUid?: string;
  addedByName?: string;
  addedByInitial?: string;
  purchasedByUid?: string;
  purchasedByName?: string;
  purchasedByInitial?: string;
  
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
