import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { assessmentService } from '../services/api';
import DataTable from '../components/DataTable';
import { ClipboardList } from 'lucide-react';

const Assessments = () => {
  const { data, isLoading } = useQuery({ queryKey: ['assessments'], queryFn: () => assessmentService.getAll() });

  const columns = [
    { header: 'Title', accessor: 'title' },
    { header: 'Type', accessor: 'type', render: (t) => <span className="capitalize">{t}</span> },
    { header: 'Subject', accessor: 'Subject', render: (s) => s?.name || '-' },
    { header: 'Class', accessor: 'Class', render: (c) => c?.name || '-' },
    { header: 'Total Marks', accessor: 'totalMarks' },
    { header: 'Status', accessor: 'status', render: (s) => (
      <span className={`px-2 py-1 rounded-full text-xs ${s === 'graded' ? 'bg-green-100 text-green-700' : s === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{s}</span>
    )},
    { header: 'Date', accessor: 'scheduledDate', render: (d) => d ? new Date(d).toLocaleDateString() : '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Assessments</h1><p className="text-gray-500">View all assessments created by teachers</p></div>
      </div>
      <DataTable columns={columns} data={data?.data?.data || []} loading={isLoading} emptyMessage="No assessments found" />
    </div>
  );
};

export default Assessments;
