import { create } from 'zustand';
import { Id } from '@/convex/_generated/dataModel';

export const LOCAL_STORAGE_KEY_LIKED = 'liked';
export const LOCAL_STORAGE_KEY_DISLIKED = 'disliked';

type ListingId = Id<'listings'>;

type RepurposedStore = {
  liked: Set<ListingId>;
  disliked: Set<ListingId>;
  _updateLiked: (liked: Set<ListingId>) => void;
  _updateDisliked: (disliked: Set<ListingId>) => void;
  addLiked: (liked: ListingId) => void;
  addDisliked: (disliked: ListingId) => void;
  removeLiked: (likedId: ListingId) => void;
  removeDisliked: (disliked: ListingId) => void;
  // ── Map focus ────────────────────────────────────────────────────────────────
  focusedListingId: string | null;
  setFocusedListingId: (id: string | null) => void;
};

export const useRepurposedStore = create<RepurposedStore>((set, get) => ({
  liked: new Set(),
  disliked: new Set(),
  focusedListingId: null,
  setFocusedListingId: (id) => set({ focusedListingId: id }),
  _updateLiked: (liked) => {
    set(() => ({ liked }));
    localStorage.setItem(LOCAL_STORAGE_KEY_LIKED, JSON.stringify([...liked.values()]));
  },
  _updateDisliked: (disliked) => {
    set(() => ({ disliked }));
    localStorage.setItem(LOCAL_STORAGE_KEY_DISLIKED, JSON.stringify([...disliked.values()]));
  },
  addLiked: (liked) => {
    get()._updateLiked(new Set([...get().liked, liked]));
  },
  addDisliked: (disliked) => get()._updateDisliked(new Set([...get().disliked, disliked])),
  removeLiked: (likedId) => {
    const liked = new Set(get().liked);
    if (liked.delete(likedId)) get()._updateLiked(liked);
  },
  removeDisliked: (dislikedId) => {
    const disliked = new Set(get().disliked);
    if (disliked.delete(dislikedId)) get()._updateDisliked(disliked);
  }
}));
