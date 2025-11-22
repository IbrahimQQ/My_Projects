import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/api';
import { Bell, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: () => notificationService.getUserNotifications() });

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationService.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries(['notifications']),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries(['notifications']),
  });

  const notifications = data?.data?.data || [];
  const unreadCount = data?.data?.unreadCount || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unreadCount > 0 && <button onClick={() => markAllMutation.mutate()} className="text-sm text-primary-600">Mark all read</button>}
      </div>

      {isLoading && <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="card animate-pulse"><div className="h-20 bg-gray-200 rounded" /></div>)}</div>}

      <div className="space-y-3">
        {notifications.map(item => (
          <div key={item.id} className={`card ${!item.isRead ? 'border-l-4 border-l-primary-600' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{item.Notification?.title}</p>
                <p className="text-sm text-gray-600 mt-1">{item.Notification?.message}</p>
                <p className="text-xs text-gray-400 mt-2">{item.createdAt && formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</p>
              </div>
              {!item.isRead && <button onClick={() => markReadMutation.mutate(item.id)} className="p-2 hover:bg-gray-100 rounded-lg text-primary-600"><Check size={16} /></button>}
            </div>
          </div>
        ))}
      </div>

      {!isLoading && notifications.length === 0 && <div className="card text-center py-12"><Bell size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-500">No notifications</p></div>}
    </div>
  );
};

export default Notifications;
