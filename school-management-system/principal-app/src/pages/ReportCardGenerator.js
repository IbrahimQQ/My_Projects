import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService, classService, studentService, academicYearService } from '../services/api';
import { FileText, Printer, Download, Users, User, TrendingUp, TrendingDown, Minus, Award, AlertCircle, CheckCircle, Clock, Star, ChevronDown, ChevronUp } from 'lucide-react';

const ReportCardGenerator = () => {
  const [mode, setMode] = useState('individual'); // 'individual' or 'class'
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [reportCard, setReportCard] = useState(null);
  const [classReportCards, setClassReportCards] = useState(null);
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const printRef = useRef();

  const { data: classesData } = useQuery({ queryKey: ['classes'], queryFn: () => classService.getAll() });
  const { data: studentsData } = useQuery({
    queryKey: ['students', selectedClass],
    queryFn: () => studentService.getAll({ classId: selectedClass, limit: 100 }),
    enabled: !!selectedClass
  });
  const { data: yearsData } = useQuery({ queryKey: ['academic-years'], queryFn: () => academicYearService.getAll() });

  const classes = classesData?.data?.data || [];
  const students = studentsData?.data?.data || [];
  const academicYears = yearsData?.data?.data || [];
  const terms = academicYears.flatMap(y => y.Terms?.map(t => ({ ...t, yearName: y.name })) || []);

  const generateIndividualReport = async () => {
    if (!selectedStudent) return;
    try {
      const { data } = await reportService.generateReportCard({ studentId: selectedStudent, termId: selectedTerm || undefined });
      setReportCard(data.data);
      setClassReportCards(null);
    } catch (error) {
      console.error('Error generating report card:', error);
    }
  };

  const generateClassReports = async () => {
    if (!selectedClass) return;
    try {
      const { data } = await reportService.generateClassReportCards({ classId: selectedClass, termId: selectedTerm || undefined });
      setClassReportCards(data.data);
      setReportCard(null);
    } catch (error) {
      console.error('Error generating class report cards:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleSubject = (subject) => {
    setExpandedSubjects(prev => ({ ...prev, [subject]: !prev[subject] }));
  };

  const getTrendIcon = (direction) => {
    if (direction === 'improving') return <TrendingUp className="text-green-500" size={16} />;
    if (direction === 'declining') return <TrendingDown className="text-red-500" size={16} />;
    return <Minus className="text-gray-400" size={16} />;
  };

  const getPerformanceColor = (level) => {
    const colors = { green: 'bg-green-100 text-green-700', blue: 'bg-blue-100 text-blue-700', yellow: 'bg-yellow-100 text-yellow-700', red: 'bg-red-100 text-red-700' };
    return colors[level] || colors.blue;
  };

  const getGradeColor = (letter) => {
    if (letter?.startsWith('A')) return 'text-green-600';
    if (letter?.startsWith('B')) return 'text-blue-600';
    if (letter?.startsWith('C')) return 'text-yellow-600';
    if (letter?.startsWith('D')) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Report Card Generator</h1>
        {(reportCard || classReportCards) && (
          <button onClick={handlePrint} className="btn-primary flex items-center gap-2">
            <Printer size={18} /> Print Report
          </button>
        )}
      </div>

      {/* Mode Selection */}
      <div className="card">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => { setMode('individual'); setReportCard(null); setClassReportCards(null); }}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${mode === 'individual' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <User className={`mx-auto mb-2 ${mode === 'individual' ? 'text-primary-600' : 'text-gray-400'}`} size={24} />
            <p className="font-medium">Individual Student</p>
            <p className="text-sm text-gray-500">Generate detailed report card for one student</p>
          </button>
          <button
            onClick={() => { setMode('class'); setReportCard(null); setClassReportCards(null); }}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${mode === 'class' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <Users className={`mx-auto mb-2 ${mode === 'class' ? 'text-primary-600' : 'text-gray-400'}`} size={24} />
            <p className="font-medium">Entire Class</p>
            <p className="text-sm text-gray-500">Generate summary report cards for all students</p>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Class *</label>
            <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setSelectedStudent(''); }} className="select">
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {mode === 'individual' && (
            <div>
              <label className="label">Student *</label>
              <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="select" disabled={!selectedClass}>
                <option value="">Select Student</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Term (Optional)</label>
            <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} className="select">
              <option value="">All Terms</option>
              {terms.map(t => <option key={t.id} value={t.id}>{t.name} - {t.yearName}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={mode === 'individual' ? generateIndividualReport : generateClassReports}
            disabled={mode === 'individual' ? !selectedStudent : !selectedClass}
            className="btn-primary flex items-center gap-2"
          >
            <FileText size={18} /> Generate Report Card{mode === 'class' ? 's' : ''}
          </button>
        </div>
      </div>

      {/* Individual Report Card */}
      {reportCard && (
        <div ref={printRef} className="space-y-6 print:space-y-4">
          {/* Header */}
          <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white print:bg-white print:text-black print:border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Student Report Card</h2>
                <p className="opacity-90">{reportCard.term?.academicYear} - {reportCard.term?.name || 'All Terms'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-75">Generated</p>
                <p>{new Date(reportCard.generatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Student Info */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">Student Information</h3>
                <div className="space-y-2">
                  <p><span className="text-gray-500">Name:</span> <span className="font-medium">{reportCard.student.name}</span></p>
                  <p><span className="text-gray-500">Student ID:</span> {reportCard.student.studentId}</p>
                  <p><span className="text-gray-500">Class:</span> {reportCard.class.name}</p>
                  <p><span className="text-gray-500">Class Teacher:</span> {reportCard.class.classTeacher || 'N/A'}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-3">Overall Performance</h3>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className={`text-4xl font-bold ${getGradeColor(reportCard.academicPerformance.overallGrade?.letter)}`}>
                      {reportCard.academicPerformance.overallGrade?.letter}
                    </p>
                    <p className="text-sm text-gray-500">{reportCard.academicPerformance.overallGrade?.description}</p>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p><span className="text-gray-500">Average:</span> <span className="font-semibold">{reportCard.academicPerformance.overallAverage}%</span></p>
                    <p><span className="text-gray-500">Class Rank:</span> <span className="font-semibold">{reportCard.academicPerformance.classRank} of {reportCard.academicPerformance.totalStudents}</span></p>
                    <p><span className="text-gray-500">Percentile:</span> <span className="font-semibold">{reportCard.academicPerformance.percentile}%</span></p>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-gray-500 mb-1">Compared to class average ({reportCard.academicPerformance.classAverage}%)</p>
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${reportCard.academicPerformance.comparisonToClass >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {reportCard.academicPerformance.comparisonToClass >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {reportCard.academicPerformance.comparisonToClass >= 0 ? '+' : ''}{reportCard.academicPerformance.comparisonToClass}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subject Performance */}
          <div className="card">
            <h3 className="font-semibold text-lg mb-4">Subject-wise Performance</h3>
            <div className="space-y-3">
              {Object.entries(reportCard.academicPerformance.subjects).map(([subject, data]) => (
                <div key={subject} className="border rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleSubject(subject)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xl font-bold ${getGradeColor(data.grade?.letter)}`}>{data.grade?.letter}</span>
                      <div>
                        <p className="font-medium">{subject}</p>
                        <p className="text-sm text-gray-500">{data.count} assessment{data.count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">{data.average.toFixed(1)}%</p>
                        <div className="flex items-center gap-1 text-sm">
                          {getTrendIcon(data.trend?.direction)}
                          <span className={data.comparisonToClass >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {data.comparisonToClass >= 0 ? '+' : ''}{data.comparisonToClass.toFixed(1)}% vs class
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${getPerformanceColor(data.performanceLevel?.color)}`}>
                        {data.performanceLevel?.level}
                      </span>
                      {expandedSubjects[subject] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  {expandedSubjects[subject] && (
                    <div className="border-t bg-gray-50 p-4 space-y-4">
                      {/* Parent Explanation */}
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">{data.parentExplanation}</p>
                      </div>

                      {/* Assessment Details */}
                      {data.assessments?.length > 0 && (
                        <div>
                          <p className="font-medium mb-2">Assessment Details</p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="text-left p-2">Assessment</th>
                                  <th className="text-left p-2">Type</th>
                                  <th className="text-center p-2">Score</th>
                                  <th className="text-center p-2">Grade</th>
                                </tr>
                              </thead>
                              <tbody>
                                {data.assessments.map((a, i) => (
                                  <tr key={i} className="border-b">
                                    <td className="p-2">{a.title}</td>
                                    <td className="p-2 capitalize">{a.type}</td>
                                    <td className="p-2 text-center">{a.marks}/{a.total} ({a.percentage.toFixed(1)}%)</td>
                                    <td className={`p-2 text-center font-medium ${getGradeColor(a.grade)}`}>{a.grade}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Improvement Suggestions */}
                      {data.improvementSuggestions?.length > 0 && (
                        <div>
                          <p className="font-medium mb-2">Suggestions for Improvement</p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                            {data.improvementSuggestions.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Attendance */}
          <div className="card">
            <h3 className="font-semibold text-lg mb-4">Attendance Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-full ${reportCard.attendance.rating?.color === 'green' ? 'bg-green-100' : reportCard.attendance.rating?.color === 'red' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                    <Clock className={reportCard.attendance.rating?.color === 'green' ? 'text-green-600' : reportCard.attendance.rating?.color === 'red' ? 'text-red-600' : 'text-yellow-600'} size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{reportCard.attendance.percentage?.toFixed(1)}%</p>
                    <p className={`text-sm ${reportCard.attendance.rating?.color === 'green' ? 'text-green-600' : reportCard.attendance.rating?.color === 'red' ? 'text-red-600' : 'text-yellow-600'}`}>
                      {reportCard.attendance.rating?.rating}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2"><CheckCircle className="text-green-500" size={16} /> Present: {reportCard.attendance.present}</div>
                  <div className="flex items-center gap-2"><AlertCircle className="text-red-500" size={16} /> Absent: {reportCard.attendance.absent}</div>
                  <div className="flex items-center gap-2"><Clock className="text-yellow-500" size={16} /> Late: {reportCard.attendance.late}</div>
                  <div className="flex items-center gap-2"><CheckCircle className="text-blue-500" size={16} /> Excused: {reportCard.attendance.excused}</div>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">{reportCard.attendance.parentExplanation}</p>
              </div>
            </div>
          </div>

          {/* Strengths & Areas for Improvement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card bg-green-50">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-green-700">
                <Star size={20} /> Strengths
              </h3>
              {reportCard.analysis.strengths?.length > 0 ? (
                <ul className="space-y-2">
                  {reportCard.analysis.strengths.map((s, i) => (
                    <li key={i} className="flex items-center gap-2 text-green-700">
                      <CheckCircle size={16} /> {s.note} ({s.average.toFixed(1)}%)
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-green-600 text-sm">Keep working to identify key strengths!</p>
              )}
            </div>
            <div className="card bg-orange-50">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-orange-700">
                <TrendingUp size={20} /> Areas for Improvement
              </h3>
              {reportCard.analysis.areasForImprovement?.length > 0 ? (
                <ul className="space-y-2">
                  {reportCard.analysis.areasForImprovement.map((a, i) => (
                    <li key={i} className="text-orange-700">
                      <p className="font-medium">{a.subject} ({a.average.toFixed(1)}%)</p>
                      <ul className="text-sm ml-4 mt-1 list-disc">
                        {a.suggestions?.slice(0, 2).map((s, j) => <li key={j}>{s}</li>)}
                      </ul>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-orange-600 text-sm">Great job! No major areas of concern.</p>
              )}
            </div>
          </div>

          {/* Overall Suggestions */}
          {reportCard.analysis.overallSuggestions?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-lg mb-3">Recommendations for Parents</h3>
              <ul className="space-y-2">
                {reportCard.analysis.overallSuggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Parent Summary Letter */}
          <div className="card bg-gray-50">
            <h3 className="font-semibold text-lg mb-3">Summary Letter for Parents</h3>
            <div className="whitespace-pre-line text-gray-700 bg-white p-4 rounded-lg border">
              {reportCard.analysis.parentSummary}
            </div>
          </div>
        </div>
      )}

      {/* Class Report Cards Summary */}
      {classReportCards && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">{classReportCards.class.name} - Report Cards</h2>
                <p className="text-gray-500">{classReportCards.totalStudents} students | Class Average: {classReportCards.classAverage}%</p>
              </div>
              <button className="btn-secondary flex items-center gap-2">
                <Download size={18} /> Export All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">Rank</th>
                    <th className="text-left p-3">Student</th>
                    <th className="text-center p-3">Average</th>
                    <th className="text-center p-3">Grade</th>
                    <th className="text-center p-3">Subjects</th>
                    <th className="text-center p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classReportCards.reportCards.map((card) => (
                    <tr key={card.studentId} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${card.rank <= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100'}`}>
                          {card.rank}
                        </span>
                      </td>
                      <td className="p-3">
                        <p className="font-medium">{card.name}</p>
                        <p className="text-xs text-gray-500">{card.studentNumber}</p>
                      </td>
                      <td className="p-3 text-center font-semibold">{card.overallAverage}%</td>
                      <td className={`p-3 text-center font-bold ${getGradeColor(card.grade?.letter)}`}>{card.grade?.letter}</td>
                      <td className="p-3 text-center">{card.subjectCount}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedStudent(card.studentId.toString());
                            setMode('individual');
                            setTimeout(generateIndividualReport, 100);
                          }}
                          className="text-primary-600 hover:text-primary-700 text-sm"
                        >
                          View Full Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!reportCard && !classReportCards && (
        <div className="card text-center py-12">
          <FileText className="mx-auto mb-4 text-gray-300" size={48} />
          <p className="text-gray-500">Select a class and student to generate a report card</p>
          <p className="text-sm text-gray-400 mt-1">Report cards include comprehensive analysis and parent-friendly explanations</p>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:space-y-4, .print\\:space-y-4 * { visibility: visible; }
          .print\\:space-y-4 { position: absolute; left: 0; top: 0; width: 100%; }
          .card { break-inside: avoid; }
          button, .btn-primary, .btn-secondary { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ReportCardGenerator;
