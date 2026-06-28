import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

type AuthTab = 'signin' | 'signup';

export function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (user) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    navigate('/dashboard');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess('Account created! You can now sign in.');
    setActiveTab('signin');
    setPassword('');
    setConfirmPassword('');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-ink font-fraunces">BridgeLearn</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-ink/60 hover:text-ink text-sm font-medium transition-colors font-inter"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Auth Form */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg border border-cream overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-cream">
              <button
                onClick={() => {
                  setActiveTab('signin');
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex-1 py-4 text-sm font-medium transition-colors font-inter ${
                  activeTab === 'signin'
                    ? 'text-primary bg-primary/5 border-b-2 border-primary'
                    : 'text-ink/50 hover:text-ink/70'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setActiveTab('signup');
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex-1 py-4 text-sm font-medium transition-colors font-inter ${
                  activeTab === 'signup'
                    ? 'text-primary bg-primary/5 border-b-2 border-primary'
                    : 'text-ink/50 hover:text-ink/70'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6 sm:p-8">
              <div className="text-center mb-6">
                <h2 className="font-fraunces text-2xl font-medium text-ink">
                  {activeTab === 'signin' ? 'Welcome back!' : 'Create your account'}
                </h2>
                <p className="text-ink/60 text-sm mt-2 font-inter">
                  {activeTab === 'signin'
                    ? 'Sign in to continue your learning journey'
                    : 'Start your learning journey today'}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg font-inter">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-sage/10 border border-sage/30 text-sage text-sm rounded-lg font-inter">
                  {success}
                </div>
              )}

              <form onSubmit={activeTab === 'signin' ? handleSignIn : handleSignUp}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-ink mb-1.5 font-inter">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-ink/40" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full pl-10 pr-4 py-3 border border-cream bg-cream/30 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary/30 outline-none transition-all font-inter"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-ink mb-1.5 font-inter">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-ink/40" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={activeTab === 'signin' ? 'Enter your password' : 'Create a password'}
                        required
                        className="w-full pl-10 pr-12 py-3 border border-cream bg-cream/30 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary/30 outline-none transition-all font-inter"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/60"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {activeTab === 'signup' && (
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-ink mb-1.5 font-inter">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-ink/40" />
                        <input
                          id="confirmPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm your password"
                          required
                          className="w-full pl-10 pr-4 py-3 border border-cream bg-cream/30 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary/30 outline-none transition-all font-inter"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 py-3 px-4 bg-accent text-cream font-medium rounded-[8px] hover:bg-accent/90 focus:ring-2 focus:ring-accent/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-inter"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-cream border-t-transparent rounded-full animate-spin"></div>
                      {activeTab === 'signin' ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : activeTab === 'signin' ? (
                    'Sign In'
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-ink/50 mt-6 font-inter">
                {activeTab === 'signin' ? (
                  <>
                    Don't have an account?{' '}
                    <button
                      onClick={() => {
                        setActiveTab('signup');
                        setError(null);
                      }}
                      className="text-primary font-medium hover:underline"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      onClick={() => {
                        setActiveTab('signin');
                        setError(null);
                      }}
                      className="text-primary font-medium hover:underline"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-ink/40 mt-6 font-inter">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
