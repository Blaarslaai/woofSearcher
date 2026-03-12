import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from './pages/Dashboard';
import FavoritesPage from './pages/Favorites';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
