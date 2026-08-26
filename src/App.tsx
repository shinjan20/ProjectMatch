import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Login from './pages/Login';
import Register from './pages/Register';
import RecruiterDashboard from './pages/RecruiterDashboard';
import Settings from './pages/Settings';
import StudentProfileForm from './pages/StudentProfileForm';
import StudentDashboard from './pages/StudentDashboard';
import CompletedProjects from './pages/CompletedProjects';
import AuthCallback from './pages/AuthCallback';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CompanyProfile from './pages/CompanyProfile';
import NotFound from './pages/NotFound';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AIProvider } from './contexts/AIContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Navigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';
import StudentBottomNav from './components/navigation/StudentBottomNav';
import RecruiterBottomNav from './components/navigation/RecruiterBottomNav';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, userRole } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col font-sans overflow-x-hidden w-full">
      <Navbar />
      <main className={`flex-grow ${isAuthenticated ? 'pb-16 md:pb-0' : ''}`}>
        {children}
      </main>
      <Footer />
      
      {/* Mobile Bottom Navigation - Only for Authenticated Users */}
      {isAuthenticated && userRole === 'student' && <StudentBottomNav />}
      {isAuthenticated && userRole === 'recruiter' && <RecruiterBottomNav />}
    </div>
  );
};

const AuthRedirect = ({ to }: { to: string }) => {
  React.useEffect(() => {
    toast.error("Please log in to access this page", { id: 'auth-redirect' });
  }, []);
  return <Navigate to={to} replace />;
};

const ProtectedStudentRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, userRole, hasCompletedProfile, isAuthLoading } = useAuth();

  // FIX #17: Don't redirect until auth is confirmed — prevents flash of wrong route
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b0f19]">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <AuthRedirect to="/login" />;
  if (userRole === 'student' && !hasCompletedProfile) return <Navigate to="/student-profile-setup" replace />;

  return <>{children}</>;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b0f19]">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <AuthRedirect to="/login" />;

  return <>{children}</>;
};

function App() {
  React.useEffect(() => {
    // Intercept Supabase Auth recovery redirects that land on the root path
    // e.g., when the email template drops the path or uses the global Site URL
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      // Redirect to the reset password page with the hash intact so Supabase can parse it
      window.location.replace(`/reset-password${hash}`);
    }
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <AIProvider>
          <Router>
            <ScrollToTop />
            <MainLayout>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/auth/v1/update-password" element={<ResetPassword />} />
                  <Route path="/auth/v1/callback" element={<AuthCallback />} />
                  <Route path="/student-profile-setup" element={<StudentProfileForm />} />
                  <Route path="/dashboard/student" element={<ProtectedStudentRoute><StudentDashboard /></ProtectedStudentRoute>} />
                  <Route path="/completed-projects" element={<ProtectedStudentRoute><CompletedProjects /></ProtectedStudentRoute>} />
                  <Route path="/dashboard/recruiter" element={<ProtectedRoute><RecruiterDashboard /></ProtectedRoute>} />
                  <Route path="/company/:companyId" element={<ProtectedRoute><CompanyProfile /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

                  {/* Catch-all route — proper 404 page */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
            </MainLayout>
            <Toaster position="bottom-right" toastOptions={{
              className: 'dark:bg-slate-900 dark:text-white',
              style: {
                borderRadius: '12px',
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid rgba(226, 232, 240, 0.4)',
              },
            }} />
          </Router>
        </AIProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
