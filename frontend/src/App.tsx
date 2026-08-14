import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import { useAuth } from "./context/useAuth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

// onboarding is one-time: bounce to /dashboard if preferences already exist (blocks back-button/bookmark re-entry, not just the post-login redirect).
function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { hasPreferences } = useAuth();
  return hasPreferences ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

// mirror of OnboardingRoute: dashboard needs preferences to exist (GET /api/dashboard 404s otherwise), so send anyone without them back to onboarding.
function DashboardRoute({ children }: { children: React.ReactNode }) {
  const { hasPreferences } = useAuth();
  return hasPreferences ? <>{children}</> : <Navigate to="/onboarding" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route
        path="/onboarding"
        element={
          <PrivateRoute>
            <OnboardingRoute>
              <Onboarding />
            </OnboardingRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardRoute>
              <Dashboard />
            </DashboardRoute>
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
