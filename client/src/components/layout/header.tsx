import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon, BellIcon } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications?unread=true', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted) setUnreadCount(Array.isArray(data) ? data.length : 0);
      } catch {}
    };
    fetchNotifications();
    const id = setInterval(fetchNotifications, 15000);
    return () => { isMounted = false; clearInterval(id); };
  }, []);

  const loadNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const res = await fetch('/api/notifications?unread=false', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const toggleNotifications = async () => {
    const next = !showNotifications;
    setShowNotifications(next);
    if (next) {
      await loadNotifications();
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST', credentials: 'include' });
      if (!res.ok) return;
      setNotifications((prev) => prev.map(n => n.id === id ? { ...n, isRead: 1 } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    await Promise.all(unread.map(n => fetch(`/api/notifications/${n.id}/read`, { method: 'POST', credentials: 'include' })));
    setNotifications((prev) => prev.map(n => ({ ...n, isRead: 1 })));
    setUnreadCount(0);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="relative">
            <SearchIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <Input
              type="text"
              placeholder="Search tickets..."
              className="w-64 pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-header-search"
            />
          </div>
          
          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2"
              data-testid="button-notifications"
              onClick={toggleNotifications}
            >
              <BellIcon className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                <div className="px-3 py-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium">Notifications</span>
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">Mark all read</Button>
                </div>
                <div className="py-1">
                  {loadingNotifs && (
                    <div className="px-3 py-3 text-sm text-muted-foreground">Loading…</div>
                  )}
                  {!loadingNotifs && notifications.length === 0 && (
                    <div className="px-3 py-3 text-sm text-muted-foreground">No notifications</div>
                  )}
                  {!loadingNotifs && notifications.map((n) => (
                    <div key={n.id} className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium truncate">{n.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2">{n.message}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!n.isRead && (
                            <Button variant="ghost" size="sm" className="text-xs" onClick={() => markAsRead(n.id)}>Read</Button>
                          )}
                          {n.data?.ticketId && (
                            <Button variant="ghost" size="sm" className="text-xs" onClick={() => { window.location.href = `/ticket/${n.data.ticketId}`; }}>Open</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
