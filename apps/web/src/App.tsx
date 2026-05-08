import { Routes, Route } from 'react-router';
import { AuthProvider } from '@/components/AuthProvider';
import { Navbar } from '@/components/Navbar';
import { CinemaDecor } from '@/components/CinemaDecor';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { MovieDetailPage } from '@/pages/MovieDetailPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { PublicProfilePage } from '@/pages/PublicProfilePage';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen pt-16">
        <CinemaDecor />
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/movie/:id" element={<MovieDetailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/u/:name" element={<PublicProfilePage />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
