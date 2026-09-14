import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import "./NotificationBell.css";

export default function NotificationBell({ firebaseUid }) {
    const [open, setOpen] = useState(false);
    const { notifications, unreadCount, markAsRead } = useNotifications(firebaseUid);
    const navigate = useNavigate();

    /*When the user clicks on a notification, mark it as read and navigate to the issue page if it exists */
    const handleNotificationClick = async (notification) => {
        await markAsRead(notification._id);
        setOpen(false);

        if (notification.issueId) {
            navigate(`/issue/${notification.issueId}`);
        }
    };

    return (
        <div className="notification-bell-wrapper">
            <button
                type="button"
                className="notification-bell-button"
                onClick={() => setOpen((isOpen) => !isOpen)}
                aria-label={unreadCount ? `${unreadCount} unread notifications` : "Notifications"}
                aria-expanded={open}
                title="Notifications"
            >
                <Bell size={21} />
                {unreadCount > 0 && <span className="notification-bell-count">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </button>

            {open && (
                <div className="notification-bell-menu">
                    <div className="notification-bell-menu-header">
                        <strong>Notifications</strong>
                        <span>{unreadCount} unread</span>
                    </div>

                    {notifications.length === 0 ? (
                        <p className="notification-bell-empty">No notifications yet.</p>
                    ) : (
                        notifications.slice(0, 8).map((notification) => (
                            <button
                                type="button"
                                className={`notification-bell-item ${notification.isRead ? "" : "unread"}`}
                                key={notification._id}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <strong>{notification.title}</strong>
                                <span className="notification-bell-issue-title">
                                    {notification.issueTitle}
                                </span>
                                <span>{notification.notificationText}</span>
                                <small>{new Date(notification.createdAt).toLocaleString("en-AU")}</small>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
