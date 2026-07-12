import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type CartStore = {
  itemCount: number;
  setItemCount: (count: number) => void;
  incrementCount: (by?: number) => void;
  resetCount: () => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      itemCount: 0,
      setItemCount: (count) => set({ itemCount: count }),
      incrementCount: (by = 1) => set((state) => ({ itemCount: state.itemCount + by })),
      resetCount: () => set({ itemCount: 0 }),
    }),
    { name: 'nayakapda-cart' }
  )
);
