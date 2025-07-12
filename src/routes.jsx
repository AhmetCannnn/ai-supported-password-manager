import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/LoginPage";
import Register from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFoundPage";

const AppRoutes = ({ theme, isDarkMode, toggleTheme }) => (
  <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<Login theme={theme} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} />
    <Route path="/register" element={<Register theme={theme} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} />
    <Route path="/dashboard" element={<Dashboard theme={theme} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
