import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock } from 'lucide-react';
import Button from '../components/Button';
import Text from '../components/Text';
import Checkbox from '../components/Checkbox';
import { TextInput } from '../components/Input';
import LottieLoader from '../components/LottieLoader';
import useToastStore from '../store/useToastStore';
import Toast from '../components/toasts/Toast';
import { getErrorMessage } from '../utils/errorHandler';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToastStore();

 
  useEffect(() => {
    const pendingInvite = sessionStorage.getItem('pendingJoinInvite');
    if (pendingInvite) {
      // User was redirected here to login for join process
      // We'll handle this after successful login
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);

      // Check if there's a pending join invite to resume
      const pendingInvite = sessionStorage.getItem('pendingJoinInvite');
      if (pendingInvite) {
        const inviteData = JSON.parse(pendingInvite);
        sessionStorage.removeItem('pendingJoinInvite');
        navigate(`/join-request?inviteId=${inviteData.inviteId}&code=${inviteData.code}`);
        return;
      }

      // Check for return URL from join process
      const returnUrl = searchParams.get('returnUrl');
      if (returnUrl) {
        navigate(decodeURIComponent(returnUrl));
        return;
      }

      navigate('/my-trees');
    } catch (err) {
      console.log('Login error details:', {
        code: err.code,
        message: err.message,
        name: err.name,
        fullError: err
      });
      const userFriendlyMessage = getErrorMessage(err);
      console.log('Mapped error message:', userFriendlyMessage);
      addToast(userFriendlyMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center px-4 py-8" style={{ backgroundImage: "url('/Images/background tree.png')" }}>
      <div className="absolute inset-0"></div>
      <Toast />
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.25))',
        borderRadius: '32px',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(15px) saturate(180%)',
        WebkitBackdropFilter: 'blur(15px) saturate(180%)',
        border: '2px solid rgba(255, 255, 255, 0.25)',

      }}
        className="relative z-10 w-full max-w-md p-8 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-2xl mx-4"
      >
        <div className="text-center mb-8">
          <img src="/Images/Logo.png" alt="Logo" className="mx-auto h-20 w-auto mb-2" />
          <Text variant="h2" className="text-3xl font-bold text-gray-200">Welcome Back</Text>
          <p className="text-gray-400 mt-2">Log in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <TextInput
            backgroundColor='var(--color-gray-light)'
            label="Email Address"
            value={email}
            color='var(--color-primary-text)'
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            leadingIcon={<Mail className="h-5 w-5 text-gray-400" />}
          />
          <TextInput
            label="Password"
            value={password}
            backgroundColor='var(--color-gray-light)'
            color='var(--color-primary-text)'
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            isPasswordField={true}
            leadingIcon={<Lock className="h-5 w-5 text-gray-400" />}
          />
          <div className="flex items-center justify-between">
            <Checkbox
              label="Remember me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <div className="text-sm">
              <button
                type="button"
                onClick={() => alert('Forgot Password functionality not implemented yet')}
                className="font-medium text-black hover:text-gray-600 bg-transparent p-0 outline-none hover:border-transparent border border-transparent"
                style={{ backgroundColor: 'transparent', outline: 'none' }}
              >
                Forgot your password?
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            fullWidth
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div style={{ width: 40, height: 40, marginRight: 8 }}>
                  <LottieLoader name="loginLoader" aspectRatio={1} loop autoplay />
                </div>
                Logging in...
              </div>
            ) : (
              'Log In'
            )}
          </Button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-black">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="font-medium text-link bg-transparent p-0 outline-none hover:border-transparent border border-transparent"
              style={{ backgroundColor: 'transparent', outline: 'none' }}
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
