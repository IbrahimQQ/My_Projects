import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService, classService, studentService } from '../services/api';
import { FileText, Download, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const [reportType, setReportType] = useState('class');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');

  const { data: classes } = useQuery({ queryKey: ['classes'], queryFn: () => classService.getAll() });
  const { data: students } = useQuery({ queryKey: ['students', selectedClass], queryFn: () => studentService.getAll({ classId: selectedClass, limit: 100 }), enabled: !!selectedClass });

  const { data: reportData, isLoading: reportLoading, refetch } = useQuery({
    queryKey: ['report', reportType, selectedClass, selectedStudent],
    queryFn: () => {
      if (reportType === 'class' && selectedClass) return reportService.getClassReport({ classId: selectedClass });
      if (reportType === 'student' && selectedStudent) return reportService.getStudentReport({ studentId: selectedStudent });
      if (reportType === 'attendance' && selectedClass) return reportService.getAttendanceReport({ classId: selectedClass });
      return null;
    },
    enabled: (reportType === 'class' && !!selectedClass) || (reportType === 'student' && !!selectedStudent) || (reportType === 'attendance' && !!selectedClass),
  });

  const report = reportData?.data?.data;

  const handleExport = async (format) => {
    try {
      let response;
      if (reportType === 'class') response = await reportService.getClassReport({ classId: selectedClass, format });
      else if (reportType === 'student') response = await reportService.getStudentReport({ studentId: selectedStudent, format });
      else response = await reportService.getAttendanceReport({ classId: selectedClass, format });

      if (format !== 'json') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `report.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Reports</h1><p className="text-gray-500">Generate and export reports</p></div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="input">
            <option value="class">Class Report</option>
            <option value="student">Student Report</option>
            <option value="attendance">Attendance Report</option>
          </select>
          <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setSelectedStudent(''); }} className="input">
            <option value="">Select Class</option>
            {classes?.data?.data?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {reportType === 'student' && (
            <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="input">
              <option value="">Select Student</option>
              {students?.data?.data?.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
            </select>
          )}
          <div className="flex gap-2">
            <button onClick={() => handleExport('pdf')} className="btn-secondary flex items-center gap-2"><Download size={16} /> PDF</button>
            <button onClick={() => handleExport('xlsx')} className="btn-secondary flex items-center gap-2"><Download size={16} /> Excel</button>
          </div>
        </div>

        {reportLoading && <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>}

        {report && reportType === 'class' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{report.class?.name} - Class Performance</h3>
              <p className="text-gray-500">Class Average: <span className="font-bold text-primary-600">{report.classAverage}%</span></p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left py-2">Rank</th><th className="text-left py-2">Student</th><th className="text-left py-2">Average</th></tr></thead>
                <tbody>
                  {report.studentPerformance?.map(s => (
                    <tr key={s.studentId} className="border-b"><td className="py-2">{s.rank}</td><td className="py-2">{s.name}</td><td className="py-2">{s.overallAverage}%</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {report && reportType === 'student' && (
          <div className="space-y-6">
            <h3 className="font-semibold">{report.student?.name} - Performance Report</h3>
            <p className="text-gray-500">Overall Average: <span className="font-bold text-primary-600">{report.overallAverage}%</span></p>
            {report.subjectPerformance && Object.keys(report.subjectPerformance).length > 0 && (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={Object.entries(report.subjectPerformance).map(([subject, data]) => ({ subject, average: data.average }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="average" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {!report && !reportLoading && <div className="text-center py-12 text-gray-500"><FileText size={48} className="mx-auto mb-4 opacity-50" /><p>Select options to generate a report</p></div>}
      </div>
    </div>
  );
};

export default Reports;
