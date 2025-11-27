import { createContext, useContext, useState, type ReactNode } from 'react';
import { Notification } from '../../shared/ui/notification';

interface NotificationData {
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  duration: number;
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationData['type'], duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notification, setNotification] = useState<NotificationData | null>(null);

  const showNotification = (
    message: string,
    type: NotificationData['type'] = 'info',
    duration = 3000
  ) => {
    setNotification({ message, type, duration });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={hideNotification}
        />
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
