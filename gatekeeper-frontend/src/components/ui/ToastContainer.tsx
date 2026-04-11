"use client";

import { useNotification } from "@/contexts/NotificationContext";
import Toast from "./Toast";

const ToastContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          id={notification.id}
          type={notification.type}
          message={notification.message}
          onRemove={removeNotification}
          duration={notification.duration}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
