import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type GuestCartItem = {
  variantId: string;
  qty: number;
  unitPrice: number;
  variant: {
    id: string;
    size: string;
    color: string;
    sku: string;
    stockQty: number;
    product: {
      id: string;
      name: string;
      slug: string;
      photo: { url: string } | null;
      qtyMultiple: number;
    };
  };
};

type CartStore = {
  itemCount: number;
  setItemCount: (count: number) => void;
  incrementCount: (by?: number) => void;
  resetCount: () => void;
  
  // Guest Cart
  guestItems: GuestCartItem[];
  addGuestItemsBulk: (items: GuestCartItem[]) => void;
  removeGuestItem: (variantId: string) => void;
  updateGuestQty: (variantId: string, qty: number) => void;
  clearGuestCart: () => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      itemCount: 0,
      setItemCount: (count) => set({ itemCount: count }),
      incrementCount: (by = 1) => set((state) => ({ itemCount: state.itemCount + by })),
      resetCount: () => set({ itemCount: 0, guestItems: [] }),

      guestItems: [],
      addGuestItemsBulk: (newItems) => set((state) => {
        const updated = [...state.guestItems];
        newItems.forEach((newItem) => {
          const existingIdx = updated.findIndex((i) => i.variantId === newItem.variantId);
          if (existingIdx > -1) {
            updated[existingIdx].qty += newItem.qty;
          } else {
            updated.push(newItem);
          }
        });
        const newCount = updated.reduce((sum, item) => sum + item.qty, 0);
        return { guestItems: updated, itemCount: newCount };
      }),
      removeGuestItem: (variantId) => set((state) => {
        const updated = state.guestItems.filter((i) => i.variantId !== variantId);
        const newCount = updated.reduce((sum, item) => sum + item.qty, 0);
        return { guestItems: updated, itemCount: newCount };
      }),
      updateGuestQty: (variantId, qty) => set((state) => {
        const updated = state.guestItems.map((item) => 
          item.variantId === variantId ? { ...item, qty } : item
        );
        const newCount = updated.reduce((sum, item) => sum + item.qty, 0);
        return { guestItems: updated, itemCount: newCount };
      }),
      clearGuestCart: () => set({ guestItems: [], itemCount: 0 }),
    }),
    { name: 'nayakapda-cart' }
  )
);
