import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./App.css";
import "./v2-mobile.css";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import FlashScreen from "./components/FlashScreen";
import Footer from "./components/Footer";
import { AuthProvider } from "./context/AuthProvider";
import { useAuth } from "./context/useAuth";

const HomePage = lazy(() => import("./pages/HomePage"));
const TournamentPage = lazy(() => import("./pages/TournamentPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const ResultPage = lazy(() => import("./pages/ResultPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsAndConditionsPage = lazy(() => import("./pages/TermsAndConditionsPage"));
const RefundPolicyPage = lazy(() => import("./pages/RefundPolicyPage"));


const AppShell = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!splashDone || isLoading) {
    return <FlashScreen user={user} />;
  }

  return (
    <div className="layout">
      <Toaster position="top-right" />
      <Navbar />
      <Suspense
        fallback={
          <main className="page">
            <section className="card">Loading...</section>
          </main>
        }
      >
        <Routes>
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/tournaments" replace /> : <HomePage />}
          />
          <Route
            path="/tournaments"
            element={
              <ProtectedRoute>
                <TournamentPage />
              </ProtectedRoute>
            }
          />
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <LeaderboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <Navigate to="/profile#wallet" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <ResultPage />
              </ProtectedRoute>
            }
          />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
          <Route path="/refund-policy" element={<RefundPolicyPage />} />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/tournaments" : "/"} replace />} />
        </Routes>
      </Suspense>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
