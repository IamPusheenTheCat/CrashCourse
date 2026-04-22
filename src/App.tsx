import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import RootRedirect from './components/RootRedirect';
import LoginScreen from './screens/LoginScreen';
import MenuScreen from './screens/MenuScreen';
import QuizScreen from './screens/QuizScreen';
import ReviewScreen from './screens/ReviewScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';

export default function App() {
  return (
    <BrowserRouter>
      <>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/signup" element={<Navigate to="/login" replace />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/menu" element={<MenuScreen />} />
              <Route path="/quiz" element={<QuizScreen />} />
              <Route path="/review" element={<ReviewScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
            </Route>
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<RootRedirect />} />
          </Route>
        </Routes>
      </>
    </BrowserRouter>
  );
}
