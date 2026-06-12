import { axiosClient } from "@/globalApi";
import useNotificationStore from "@/store/NotificationStore";

const getUnreadNotifications = async () => {
  const { setUnreadCount } = useNotificationStore.getState();

  try {
    const result = await axiosClient.get("/notification/unread");
    setUnreadCount(result.data?.unreadCount || 0);
  } catch (_) {}
};

export default getUnreadNotifications;