import { useCallback, useEffect, useState } from "react";

const API_URL = "http://localhost:8000/api";

export function useNotifications(firebaseUid) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!firebaseUid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/notifications/${encodeURIComponent(firebaseUid)}`);
      if (!response.ok) throw new Error("Failed to fetch notifications");
      setNotifications(await response.json());
    } catch (error) {
      console.error(error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [firebaseUid]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId) => {
    const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firebaseUid }),
    });

    if (response.ok) {
      setNotifications((currentNotifications) => currentNotifications.map((notification) => (
        notification._id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )));
    }
  };

  return {
    notifications,
    unreadCount: notifications.filter((notification) => !notification.isRead).length,
    loading,
    markAsRead,
    refresh: fetchNotifications,
  };
}
