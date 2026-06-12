import { create } from "zustand";

type NotificationStore = {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
};

const useNotificationStore = create<NotificationStore>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
}));

export default useNotificationStore;