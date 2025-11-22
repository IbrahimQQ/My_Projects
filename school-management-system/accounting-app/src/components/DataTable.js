import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DataTable = ({ columns, data, loading, pagination, onPageChange }) => {
  if (loading) return (
    <div className="card overflow-hidden">
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded" />
        {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded" />)}
      </div>
    </div>
  );

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>{columns.map((col, i) => <th key={i} className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{col.header}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {data?.length > 0 ? data.map((row, i) => (
              <tr key={row.id || i} className="hover:bg-gray-50">
                {columns.map((col, j) => <td key={j} className="px-4 py-3 text-sm">{col.render ? col.render(row) : row[col.accessor]}</td>)}
              </tr>
            )) : <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">No data available</td></tr>}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <span className="text-sm text-gray-600">Page {pagination.page} of {pagination.totalPages} ({pagination.total} items)</span>
          <div className="flex gap-2">
            <button onClick={() => onPageChange(pagination.page - 1)} disabled={pagination.page <= 1} className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50"><ChevronLeft size={18} /></button>
            <button onClick={() => onPageChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50"><ChevronRight size={18} /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
