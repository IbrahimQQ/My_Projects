import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/api';
import { toast } from 'react-toastify';
import { Plus, Send, Bell, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import { useForm } from 'react-hook-form';

const Notifications = () => {
  const [modal, setModal] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();

  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: () => notificationService.getAll() });

  const createMutation = useMutation({
    mutationFn: (data) => notificationService.create(data),
    onSuccess: () => { toast.success('Notification created'); queryClient.invalidateQueries(['notifications']); setModal(false); reset(); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const sendMutation = useMutation({
    mutationFn: (id) => notificationService.send(id),
    onSuccess: () => { toast.success('Notification sent'); queryClient.invalidateQueries(['notifications']); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => notificationService.delete(id),
    onSuccess: () => { toast.success('Deleted'); queryClient.invalidateQueries(['notifications']); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Notifications</h1><p className="text-gray-500">Send announcements to parents and teachers</p></div>
        <button onClick={() => { reset(); setModal(true); }} className="btn-primary flex items-center gap-2"><Plus size={20} /> Create Notification</button>
      </div>

      <div className="space-y-4">
        {isLoading && <div className="card animate-pulse"><div className="h-20 bg-gray-200 rounded" /></div>}
        {data?.data?.data?.map(notification => (
          <div key={notification.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${notification.status === 'sent' ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Bell size={20} className={notification.status === 'sent' ? 'text-green-600' : 'text-gray-600'} />
                </div>
                <div>
                  <h3 className="font-semibold">{notification.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="capitalize">To: {notification.targetAudience}</span>
                    <span>Type: {notification.type}</span>
                    <span className={`px-2 py-0.5 rounded ${notification.status === 'sent' ? 'bg-green-100 text-green-700' : notification.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}>{notification.status}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {notification.status !== 'sent' && (
                  <button onClick={() => sendMutation.mutate(notification.id)} className="btn-primary text-sm flex items-center gap-1" disabled={sendMutation.isPending}>
                    <Send size={14} /> Send
                  </button>
                )}
                <button onClick={() => deleteMutation.mutate(notification.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
        {!isLoading && (!data?.data?.data || data.data.data.length === 0) && (
          <div className="card text-center py-12 text-gray-500"><Bell size={48} className="mx-auto mb-4 opacity-50" /><p>No notifications yet</p></div>
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Create Notification" size="lg">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div><label className="block text-sm font-medium mb-2">Title *</label><input {...register('title', { required: true })} className="input" placeholder="Important Announcement" /></div>
          <div><label className="block text-sm font-medium mb-2">Message *</label><textarea {...register('message', { required: true })} className="input" rows={4} placeholder="Write your message..." /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select {...register('type')} className="input">
                <option value="announcement">Announcement</option>
                <option value="event">Event</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Target Audience</label>
              <select {...register('targetAudience')} className="input">
                <option value="all">Everyone</option>
                <option value="teachers">Teachers Only</option>
                <option value="parents">Parents Only</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Priority</label>
            <select {...register('priority')} className="input">
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating...' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Notifications;
