import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditService } from '../services/api';
import DataTable from '../components/DataTable';
import { Search, Filter } from 'lucide-react';

const AuditLogs = () => {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, action, entityType],
    queryFn: () => auditService.getLogs({ page, limit: 50, action: action || undefined, entityType: entityType || undefined }),
  });

  const columns = [
    { header: 'Action', accessor: 'action', render: (a) => <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">{a}</span> },
    { header: 'Entity', accessor: 'entityType' },
    { header: 'User', accessor: 'User', render: (u) => u ? `${u.firstName} ${u.lastName}` : 'System' },
    { header: 'Role', accessor: 'User', render: (u) => u?.role ? <span className="capitalize">{u.role}</span> : '-' },
    { header: 'IP Address', accessor: 'ipAddress', render: (ip) => ip || '-' },
    { header: 'Date', accessor: 'createdAt', render: (d) => new Date(d).toLocaleString() },
  ];

  const actions = ['LOGIN', 'LOGOUT', 'CREATE_USER', 'UPDATE_USER', 'DELETE_USER', 'CREATE_TEACHER', 'CREATE_STUDENT', 'CREATE_PARENT'];
  const entities = ['User', 'Teacher', 'Student', 'Parent', 'Class', 'Subject', 'Assessment', 'Attendance'];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Audit Logs</h1><p className="text-gray-500">Track all system activities</p></div>

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <select value={action} onChange={(e) => setAction(e.target.value)} className="input max-w-xs">
            <option value="">All Actions</option>
            {actions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="input max-w-xs">
            <option value="">All Entities</option>
            {entities.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        <DataTable
          columns={columns}
          data={data?.data?.data || []}
          loading={isLoading}
          pagination={data?.data?.pagination}
          onPageChange={setPage}
          emptyMessage="No audit logs found"
        />
      </div>
    </div>
  );
};

export default AuditLogs;
