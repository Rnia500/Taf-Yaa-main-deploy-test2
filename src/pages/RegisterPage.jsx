import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import Button from '../components/Button';
import Text from '../components/Text';
import Checkbox from '../components/Checkbox';
import SelectDropdown from '../components/SelectDropdown';
import { TextInput } from '../components/Input';
import { handleSignUp, handleGoogleSignUp } from '../controllers/auth/signUpController';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    language: 'en',
    termsAccepted: false,
  });


  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleSignUp(formData, navigate, setError, setLoading);
  };

  const registerWithGoogle = async () => {
    await handleGoogleSignUp(navigate, setError, setLoading);
  };

  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white relative overflow-hidden">
      {/* Tree image on the right, branches extend behind form, centered vertically */}
      <div className="absolute right-0 top-0 bottom-0 h-full w-2/3 z-0 flex items-center justify-center">
        <img
          src="/Images/background tree.png"
          alt="Tree"
          className="object-cover h-full w-full"
        // style={{ filter: 'blur(12px)' }}
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
          <div className="mb-2">
            <h2 className="text-3xl font-bold text-gray-900 mb-1">Create account</h2>
            <p className="text-gray-600 text-md">
              Retrace your legacy with Taf'Yaa!
            </p>
          </div>
          <form onSubmit={handleSubmit} className="w-full mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <TextInput
                label="Name"
                backgroundColor='var(--color-white)'
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="Enter your name"
                height="35px"
                required
              />
              <TextInput
                label="Email"
                backgroundColor='var(--color-white)'
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
                height="35px"
                required
              />
              <TextInput
                label="Password"
                value={formData.password}
                backgroundColor='var(--color-white)'
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Password"
                height="35px"
                isPasswordField={true}
                leadingIcon={<Lock className="h-5 w-5 text-gray-400" />}
                required
              />
              <TextInput
                label="Confirm password"
                backgroundColor='var(--color-white)'
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm password"
                height="35px"
                isPasswordField={true}
                leadingIcon={<Lock className="h-5 w-5 text-gray-400" />}
                required
              />
            </div>
            <div className="flex flex-col gap-1 mb-4">
              <div className="flex items-center">
                <Checkbox
                  label={<span>I agree to all the <a href="#" className="underline">Terms</a> and <a href="#" className="underline">Privacy policy</a></span>}
                  checked={formData.termsAccepted}
                  onChange={(e) => setFormData(prev => ({ ...prev, termsAccepted: e.target.checked }))}
                />
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-2">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded-lg text-base transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create account
            </Button>
          </form>
          <div className="flex items-center my-4 w-full">
            <span className="border-b border-gray-300 flex-grow"></span>
            <span className="text-gray-500 mx-2">Or</span>
            <span className="border-b border-gray-300 flex-grow"></span>
          </div>
          <div className="flex gap-4 mb-2 w-full">
            <button
              type="button"
              onClick={() => registerWithGoogle()}
              className="flex items-center bg-cyan-50 hover:outline-none focus:outline-none focus:ring-1  focus:ring-cyan-200  justify-center border border-gray-300 rounded-md py-1.5 px-4 hover:bg-gray-100 transition w-full"
            >
              <img src="/Images/googleLogo.jpg" alt="Google Logo" className="h-6 rounded-md w-6 mr-2" />
              <span className="text-gray-700 font-medium">Sign in with Google</span>
            </button>
          </div>
          <div className="text-center mt-2">
            <span className="text-gray-700">Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-medium text-blue-600 hover:text-blue-500 bg-transparent p-0 outline-none border-none"
                style={{ backgroundColor: 'transparent', outline: 'none' }}
              >
                Log In
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}