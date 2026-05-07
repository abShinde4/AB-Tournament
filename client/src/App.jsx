import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./App.css";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import FlashScreen from "./components/FlashScreen";
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


const AppShell = () => {
  const { user, isLoading } = useAuth();
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
          <Route path="/" element={<HomePage />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
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
