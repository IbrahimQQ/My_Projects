import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './context/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import TeacherForm from './pages/TeacherForm';
import Students from './pages/Students';
import StudentForm from './pages/StudentForm';
import StudentDetails from './pages/StudentDetails';
import Parents from './pages/Parents';
import ParentForm from './pages/ParentForm';
import Classes from './pages/Classes';
import ClassForm from './pages/ClassForm';
import Subjects from './pages/Subjects';
import SubjectForm from './pages/SubjectForm';
import AcademicYears from './pages/AcademicYears';
import Assessments from './pages/Assessments';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';
import Accounting from './pages/Accounting';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="teachers" element={<Teachers />} />
        <Route path="teachers/new" element={<TeacherForm />} />
        <Route path="teachers/:id/edit" element={<TeacherForm />} />
        <Route path="students" element={<Students />} />
        <Route path="students/new" element={<StudentForm />} />
        <Route path="students/:id" element={<StudentDetails />} />
        <Route path="students/:id/edit" element={<StudentForm />} />
        <Route path="parents" element={<Parents />} />
        <Route path="parents/new" element={<ParentForm />} />
        <Route path="parents/:id/edit" element={<ParentForm />} />
        <Route path="classes" element={<Classes />} />
        <Route path="classes/new" element={<ClassForm />} />
        <Route path="classes/:id/edit" element={<ClassForm />} />
        <Route path="subjects" element={<Subjects />} />
        <Route path="subjects/new" element={<SubjectForm />} />
        <Route path="subjects/:id/edit" element={<SubjectForm />} />
        <Route path="academic-years" element={<AcademicYears />} />
        <Route path="assessments" element={<Assessments />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="accounting" element={<Accounting />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
