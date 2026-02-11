import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Text from '../components/Text';
import Spacer from '../components/Spacer';

export default function EmailVerificationPage() {
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [checkingVerification, setCheckingVerification] = useState(false);
  const { currentUser, resendEmailVerification, isCurrentUserEmailVerified, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already verified
    if (isCurrentUserEmailVerified()) {
      // Check if there's a pending join invite to resume
      const pendingInvite = sessionStorage.getItem('pendingJoinInvite');
      const redirectToJoin = sessionStorage.getItem('redirectToJoinAfterVerification');
      if (pendingInvite && redirectToJoin) {
        const inviteData = JSON.parse(pendingInvite);
        sessionStorage.removeItem('pendingJoinInvite');
        sessionStorage.removeItem('redirectToJoinAfterVerification');
        navigate(`/join-request?inviteId=${inviteData.inviteId}&code=${inviteData.code}`);
        return;
      }
      navigate('/my-trees');
    }
  }, [isCurrentUserEmailVerified, navigate]);

  const handleResendVerification = async () => {
    try {
      setResendLoading(true);
      setResendMessage('');
      await resendEmailVerification();
      setResendMessage('Verification email sent successfully! Please check your inbox.');
    } catch (error) {
      setResendMessage('Failed to send verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      setCheckingVerification(true);
      // Force refresh the user to check verification status
      await currentUser.reload();
      if (isCurrentUserEmailVerified()) {
        // Check if there's a pending join invite to resume
        const pendingInvite = sessionStorage.getItem('pendingJoinInvite');
        const redirectToJoin = sessionStorage.getItem('redirectToJoinAfterVerification');
        if (pendingInvite && redirectToJoin) {
          const inviteData = JSON.parse(pendingInvite);
          sessionStorage.removeItem('pendingJoinInvite');
          sessionStorage.removeItem('redirectToJoinAfterVerification');
          navigate(`/join-request?inviteId=${inviteData.inviteId}&code=${inviteData.code}`);
          return;
        }
        navigate('/my-trees');
      } else {
        setResendMessage('Email not yet verified. Please check your inbox and click the verification link.');
      }
    } catch (err) {
      console.error('Error checking verification:', err);
      setResendMessage('Error checking verification status. Please try again.');
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Text variant="h2">Please log in to continue</Text>
          <Button onClick={() => navigate('/login')} className="mt-4">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white relative overflow-hidden">
      {/* Tree image background */}
      <div className="absolute right-0 top-0 bottom-0 h-full w-2/3 z-0 flex items-center justify-center">
        <img
          src="/Images/background tree.png"
          alt="Tree"
          className="object-cover h-full w-full"
        />
      </div>

      {/* Form on the left with glassmorphism */}
      <div className="relative z-10 flex w-full max-w-4xl min-h-[80vh]">
        <div
          className="flex flex-col justify-center w-full max-w-xl p-6 m-4"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.25))',
            borderRadius: '32px',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(15px) saturate(180%)',
            WebkitBackdropFilter: 'blur(15px) saturate(180%)',
            border: '2px solid rgba(255, 255, 255, 0.25)',
          }}
        >
          <div className="mb-6 text-center">
            <div className="flex justify-center mb-4">
              <Mail className="h-16 w-16 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
            <p className="text-gray-600 text-md">
              We've sent a verification email to <strong>{currentUser.email}</strong>
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">What to do next:</h3>
                  <ol className="mt-2 text-sm text-blue-700 list-decimal list-inside space-y-1">
                    <li>Check your email inbox (and spam folder)</li>
                    <li>Click the verification link in the email</li>
                    <li>Return here and click "I've verified my email"</li>
                  </ol>
                </div>
              </div>
            </div>

            

            <div className='ml-8 mr-8'>
              <Button
                fullWidth
                onClick={handleCheckVerification}
                disabled={checkingVerification}
              >
                {checkingVerification ? (
                  <div className="flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                    Checking...
                  </div>
                ) : (
                  "I've verified my email"
                )}
              </Button>
            </div>

            <div className="text-center ">
              <p className="text-gray-600 text-sm mb-2">Didn't receive the email?</p>
              <Button
                onClick={handleResendVerification}
                disabled={resendLoading}
                variant="ghost"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {resendLoading ? (
                  <div className="flex items-center justify-center">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </div>
                ) : (
                  "Resend verification email"
                )}
              </Button>
            </div>

            {resendMessage && (
              <div className={`text-center text-sm ${resendMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                {resendMessage}
              </div>
            )}

            <div className="text-center pt-4 border-t border-gray-200">
              <Button
                onClick={handleLogout}
                variant="link"
            
              >
                Sign out and use different account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
