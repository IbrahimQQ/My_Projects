import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './context/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import ClassDetails from './pages/ClassDetails';
import Attendance from './pages/Attendance';
import Assessments from './pages/Assessments';
import AssessmentForm from './pages/AssessmentForm';
import GradeAssessment from './pages/GradeAssessment';
import QuestionBank from './pages/QuestionBank';
import Students from './pages/Students';
import DailyRecords from './pages/DailyRecords';
import Profile from './pages/Profile';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="classes" element={<Classes />} />
        <Route path="classes/:id" element={<ClassDetails />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="assessments" element={<Assessments />} />
        <Route path="assessments/new" element={<AssessmentForm />} />
        <Route path="assessments/:id/edit" element={<AssessmentForm />} />
        <Route path="assessments/:id/grade" element={<GradeAssessment />} />
        <Route path="question-bank" element={<QuestionBank />} />
        <Route path="students" element={<Students />} />
        <Route path="daily-records" element={<DailyRecords />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;
