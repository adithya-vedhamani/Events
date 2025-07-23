'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, Lock, MessageSquare, Key, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [tab, setTab] = useState<'password' | 'otp' | 'forgot'>('password');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [otpEmail, setOtpEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Password login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('userChanged'));
        switch (data.user.role) {
          case 'consumer':
            router.push('/dashboard/consumer');
            break;
          case 'brand_owner':
            router.push('/dashboard/brand-owner');
            break;
          case 'staff':
            router.push('/dashboard/staff');
            break;
          default:
            router.push('/dashboard');
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // OTP login
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail }),
      });
      const data = await response.json();
      if (response.ok) {
        setOtpSent(true);
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, otp }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('userChanged'));
        switch (data.user.role) {
          case 'consumer':
            router.push('/dashboard/consumer');
            break;
          case 'brand_owner':
            router.push('/dashboard/brand-owner');
            break;
          case 'staff':
            router.push('/dashboard/staff');
            break;
          default:
            router.push('/dashboard');
        }
      } else {
        setError(data.message || 'Invalid OTP');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot password
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await response.json();
      if (response.ok) {
        setForgotSent(true);
      } else {
        setError(data.message || 'Failed to send reset OTP');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp, newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setResetSuccess(true);
        setTimeout(() => {
          setTab('password');
          setForgotSent(false);
          setForgotEmail('');
          setForgotOtp('');
          setNewPassword('');
          setResetSuccess(false);
          setError('');
        }, 2000);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForgotForm = () => {
    setForgotSent(false);
    setForgotEmail('');
    setForgotOtp('');
    setNewPassword('');
    setResetSuccess(false);
    setError('');
  };

  return (
    <div className={`min-h-screen flex font-blinker transition-all duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* Left Side - Info Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
          
          {/* Floating particles */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-300"></div>
          <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-blue-400 rounded-full animate-bounce delay-700"></div>
          <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-500"></div>
          <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-purple-300 rounded-full animate-bounce delay-1000"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className={`mb-8 transition-all duration-1000 delay-300 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="flex items-center mb-6">
              <Sparkles className="h-8 w-8 text-purple-400 mr-3 animate-pulse" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
                Events
              </h1>
            </div>
            <h2 className="text-5xl font-bold mb-6 leading-tight">
              <span className={`block transition-all duration-1000 delay-500 ${mounted ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}>
                Discover Amazing
              </span>
              <span className={`block text-purple-400 transition-all duration-1000 delay-700 ${mounted ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}>
                Events
              </span>
            </h2>
            <p className={`text-xl text-slate-300 leading-relaxed transition-all duration-1000 delay-900 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              Connect with your favorite brands and discover exclusive events. 
              Join thousands of fans experiencing unforgettable moments.
            </p>
          </div>
          
          <div className={`space-y-4 transition-all duration-1000 delay-1100 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="flex items-center text-slate-300 group">
              <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 group-hover:scale-125 transition-transform duration-300"></div>
              <span className="group-hover:text-purple-300 transition-colors duration-300">Exclusive brand experiences</span>
            </div>
            <div className="flex items-center text-slate-300 group">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 group-hover:scale-125 transition-transform duration-300"></div>
              <span className="group-hover:text-blue-300 transition-colors duration-300">Secure booking system</span>
            </div>
            <div className="flex items-center text-slate-300 group">
              <div className="w-2 h-2 bg-indigo-400 rounded-full mr-3 group-hover:scale-125 transition-transform duration-300"></div>
              <span className="group-hover:text-indigo-300 transition-colors duration-300">Real-time updates</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-10 w-32 h-32 bg-purple-500 rounded-full animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-24 h-24 bg-blue-500 rounded-full animate-pulse delay-1000"></div>
        </div>
        
        <div className={`w-full max-w-md px-8 relative z-10 transition-all duration-1000 delay-500 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-[#8b55ff] mr-2 animate-pulse" />
              <h1 className="text-2xl font-bold text-black">Spaces</h1>
            </div>
            <h2 className="text-2xl font-bold text-black mb-2">Welcome back</h2>
            <p className="text-black/70">Sign in to continue your journey</p>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-3xl font-bold text-black mb-2">Welcome back</h2>
            <p className="text-black/70">Sign in to continue your journey</p>
          </div>

          {/* Glassmorphism card */}
          <div className="backdrop-blur-xl bg-white/70 rounded-2xl border border-white/20 shadow-2xl p-8 hover:shadow-3xl transition-all duration-500">
            {/* Tab navigation */}
            <div className="flex mb-8 rounded-xl overflow-hidden bg-slate-100/50 p-1">
              <button
                className={`flex-1 py-3 px-4 flex items-center justify-center font-medium text-sm transition-all duration-300 rounded-lg ${
                  tab === 'password' 
                    ? 'text-white bg-gradient-to-r from-[#8b55ff] to-[#7c3aed] shadow-lg scale-105' 
                    : 'text-black/70 hover:text-black hover:bg-white/50'
                }`}
                onClick={() => { setTab('password'); setError(''); }}
              >
                <Lock className="h-4 w-4 mr-2" /> Password
              </button>
              <button
                className={`flex-1 py-3 px-4 flex items-center justify-center font-medium text-sm transition-all duration-300 rounded-lg ${
                  tab === 'otp' 
                    ? 'text-white bg-gradient-to-r from-[#8b55ff] to-[#7c3aed] shadow-lg scale-105' 
                    : 'text-black/70 hover:text-black hover:bg-white/50'
                }`}
                onClick={() => { setTab('otp'); setError(''); }}
              >
                <MessageSquare className="h-4 w-4 mr-2" /> OTP
              </button>
              <button
                className={`flex-1 py-3 px-4 flex items-center justify-center font-medium text-sm transition-all duration-300 rounded-lg ${
                  tab === 'forgot' 
                    ? 'text-white bg-gradient-to-r from-[#8b55ff] to-[#7c3aed] shadow-lg scale-105' 
                    : 'text-black/70 hover:text-black hover:bg-white/50'
                }`}
                onClick={() => { setTab('forgot'); resetForgotForm(); }}
              >
                <Key className="h-4 w-4 mr-2" /> Reset
              </button>
            </div>

            {/* Form container with slide animation */}
            <div className="relative overflow-hidden">
              <div className={`transition-all duration-500 ease-in-out ${tab === 'password' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 absolute inset-0'}`}>
                {/* Password Login Form */}
                <form onSubmit={handlePasswordLogin} className="space-y-6">
                  <div className="animate-fadeIn">
                    <label className="block text-sm font-semibold mb-2 text-black">Email address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8b55ff]/50 focus:border-[#8b55ff] transition-all duration-300 hover:shadow-md text-black placeholder-black/50"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="animate-fadeIn delay-100">
                    <label className="block text-sm font-semibold mb-2 text-black">Password</label>
                    <div className="relative">
                                              <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={formData.password}
                          onChange={e => setFormData({ ...formData, password: e.target.value })}
                          className="w-full bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-[#8b55ff]/50 focus:border-[#8b55ff] transition-all duration-300 hover:shadow-md text-black placeholder-black/50"
                          placeholder="Enter your password"
                        />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                        onClick={() => setShowPassword(v => !v)}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm animate-shake">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#8b55ff] to-[#7c3aed] text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:transform-none active:scale-95"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    ) : (
                      "Sign in to your account"
                    )}
                  </button>
                </form>
              </div>

              <div className={`transition-all duration-500 ease-in-out ${tab === 'otp' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 absolute inset-0'}`}>
                {/* OTP Login Form */}
                <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-6">
                  <div className="animate-fadeIn">
                    <label className="block text-sm font-semibold mb-2 text-black">Email address</label>
                    <input
                      type="email"
                      required
                      value={otpEmail}
                      onChange={e => setOtpEmail(e.target.value)}
                      className="w-full bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8b55ff]/50 focus:border-[#8b55ff] transition-all duration-300 hover:shadow-md text-black placeholder-black/50"
                      placeholder="you@example.com"
                      disabled={otpSent}
                    />
                  </div>
                  {otpSent && (
                    <div className="animate-fadeIn">
                      <label className="block text-sm font-semibold mb-2 text-black">Enter OTP</label>
                      <input
                        type="text"
                        required
                        value={otp}
                        onChange={e => setOtp(e.target.value)}
                        className="w-full bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8b55ff]/50 focus:border-[#8b55ff] transition-all duration-300 hover:shadow-md text-black placeholder-black/50"
                        placeholder="Enter 6-digit code"
                      />
                    </div>
                  )}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm animate-shake">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#8b55ff] to-[#7c3aed] text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:transform-none active:scale-95"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    ) : otpSent ? (
                      "Verify OTP"
                    ) : (
                      "Send OTP"
                    )}
                  </button>
                </form>
              </div>

              <div className={`transition-all duration-500 ease-in-out ${tab === 'forgot' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 absolute inset-0'}`}>
                {/* Forgot Password Form */}
                <div className="space-y-6">
                  {!forgotSent && !resetSuccess && (
                    <form onSubmit={handleForgot} className="space-y-6">
                      <div className="animate-fadeIn">
                        <label className="block text-sm font-semibold mb-2 text-black">Email address</label>
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={e => setForgotEmail(e.target.value)}
                          className="w-full bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8b55ff]/50 focus:border-[#8b55ff] transition-all duration-300 hover:shadow-md text-black placeholder-black/50"
                          placeholder="you@example.com"
                        />
                      </div>
                      <p className="text-sm text-black/70 bg-slate-50 rounded-xl p-4 animate-fadeIn delay-100">
                        Enter your email address and we&apos;ll send you a verification code to reset your password.
                      </p>
                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm animate-shake">
                          {error}
                        </div>
                      )}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-[#8b55ff] to-[#7c3aed] text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:transform-none active:scale-95"
                      >
                        {loading ? (
                          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                        ) : (
                          "Send Reset Code"
                        )}
                      </button>
                    </form>
                  )}

                  {forgotSent && !resetSuccess && (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                      <div className="animate-fadeIn">
                        <label className="block text-sm font-semibold mb-2 text-black">Verification Code</label>
                        <input
                          type="text"
                          required
                          value={forgotOtp}
                          onChange={e => setForgotOtp(e.target.value)}
                          className="w-full bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8b55ff]/50 focus:border-[#8b55ff] transition-all duration-300 hover:shadow-md text-black placeholder-black/50"
                          placeholder="Enter the 6-digit code"
                        />
                      </div>
                      <div className="animate-fadeIn delay-100">
                        <label className="block text-sm font-semibold mb-2 text-black">New Password</label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="w-full bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8b55ff]/50 focus:border-[#8b55ff] transition-all duration-300 hover:shadow-md text-black placeholder-black/50"
                          placeholder="Enter new password"
                        />
                      </div>
                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm animate-shake">
                          {error}
                        </div>
                      )}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-[#8b55ff] to-[#7c3aed] text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:transform-none active:scale-95"
                      >
                        {loading ? (
                          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                        ) : (
                          "Reset Password"
                        )}
                      </button>
                    </form>
                  )}

                  {resetSuccess && (
                    <div className="text-center py-6 animate-fadeIn">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <div className="w-4 h-4 bg-white rounded-full"></div>
                        </div>
                      </div>
                      <div className="text-green-600 text-lg font-semibold mb-2">Password Reset Successful!</div>
                      <p className="text-black/70">Your password has been updated. You can now sign in with your new password.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="text-center text-black/70 mb-4">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-[#8b55ff] hover:text-[#7c3aed] font-semibold transition-colors duration-300 hover:underline">
                  Create one now
                </Link>
              </div>
              
              <div className="text-xs text-black/50 text-center">
                By signing in, you agree to our{' '}
                <Link href="/terms" className="underline hover:text-black/70 transition-colors duration-300">Terms of Service</Link> and{' '}
                <Link href="/privacy" className="underline hover:text-black/70 transition-colors duration-300">Privacy Policy</Link>.
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .delay-100 {
          animation-delay: 0.1s;
        }
      `}</style>
    </div>
  );
} 