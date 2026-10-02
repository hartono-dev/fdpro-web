import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';

export function NotificationBell() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await api.get('/api/notifications');
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.isRead).length);
    } catch {
      console.error('Failed to fetch notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Polling every minute
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await api.post('/api/notifications/mark-as-read');
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch {
      console.error('Failed to mark as read');
    }
  };

  const getNotificationTarget = (n: any): string => {
    const text = `${n.title} ${n.message}`.toLowerCase();
    if (text.includes('persetujuan') || text.includes('approval') || text.includes('menunggu')) {
      return '/member/team';
    }
    return '/member';
  };

  const handleNotificationClick = (n: any) => {
    setIsOpen(false);
    navigate(getNotificationTarget(n));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (open) {
        handleMarkAsRead();
        // Sinkronkan daftar setiap kali dialog dibuka: item obsolete
        // (kandidat sudah approve/reject) langsung hilang dari tampilan.
        fetchNotifications();
      }
    }}>
      <DialogTrigger asChild>
        <div className="relative cursor-pointer">
          <Bell className="h-6 w-6 text-gray-600 hover:text-blue-600 transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notifikasi</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-4">
          {notifications.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Belum ada notifikasi.</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-3 rounded-lg border text-sm transition-all cursor-pointer ${
                  !n.isRead ? 'bg-blue-50 border-blue-100 shadow-sm' : 'bg-white border-gray-100'
                } hover:shadow-md hover:border-blue-200`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-semibold ${
                    n.priority === 'high' ? 'text-red-600' : n.priority === 'medium' ? 'text-orange-600' : 'text-blue-600'
                  }`}>
                    {n.title}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(n.createdAt).toLocaleDateString('id-ID')}
                  </span>
                </div>
                <p className="text-gray-600 leading-relaxed">{n.message}</p>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
