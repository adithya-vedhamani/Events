'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Sparkles, UserPlus, Building, Users } from 'lucide-react';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['consumer', 'brand_owner', 'staff']),
  phone: z.string().optional(),
  companyName: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'consumer',
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const result = await response.json();
      const { access_token, user } = result;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new Event('userChanged'));
      
      toast.success('Registration successful!');
      
      // Redirect based on user role
      if (user.role === 'brand_owner') {
        router.push('/dashboard/brand-owner');
      } else if (user.role === 'staff') {
        router.push('/dashboard/staff');
      } else {
        router.push('/dashboard/consumer');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'consumer':
        return <Users className="h-5 w-5" />;
      case 'brand_owner':
        return <Building className="h-5 w-5" />;
      case 'staff':
        return <UserPlus className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'consumer':
        return 'Discover and book amazing events and experiences';
      case 'brand_owner':
        return 'Create and manage your brand events and spaces';
      case 'staff':
        return 'Help manage events and assist brand owners';
      default:
        return '';
    }
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
                Join the
              </span>
              <span className={`block text-purple-400 transition-all duration-1000 delay-700 ${mounted ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}>
                Community
              </span>
            </h2>
            <p className={`text-xl text-slate-300 leading-relaxed transition-all duration-1000 delay-900 text-center ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              Create your account and start your journey with Events.
              Connect with brands, discover events, and create unforgettable experiences.
            </p>
          </div>
          
          <div className={`space-y-4 transition-all duration-1000 delay-1100 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="flex items-center text-slate-300 group">
              <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 group-hover:scale-125 transition-transform duration-300"></div>
              <span className="group-hover:text-purple-300 transition-colors duration-300">Create your profile in seconds</span>
            </div>
            <div className="flex items-center text-slate-300 group">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 group-hover:scale-125 transition-transform duration-300"></div>
              <span className="group-hover:text-blue-300 transition-colors duration-300">Access exclusive events</span>
            </div>
            <div className="flex items-center text-slate-300 group">
              <div className="w-2 h-2 bg-indigo-400 rounded-full mr-3 group-hover:scale-125 transition-transform duration-300"></div>
              <span className="group-hover:text-indigo-300 transition-colors duration-300">Connect with brands and communities</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
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
              <h1 className="text-2xl font-bold text-black">Events</h1>
            </div>
            <h2 className="text-2xl font-bold text-black mb-2 text-center">Create your account</h2>
            <p className="text-black/70 text-center">Join our community and start your journey</p>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-3xl font-bold text-black mb-2">Create your account</h2>
            <p className="text-black/70">Join our community and start your journey</p>
          </div>

          {/* Glassmorphism card */}
          <div className="backdrop-blur-xl bg-white/70 rounded-2xl border border-white/20 shadow-2xl p-8 hover:shadow-3xl transition-all duration-500">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="animate-fadeIn">
                  <label className="block text-sm font-semibold mb-2 text-black">First Name</label>
                  <input
                    {...register('firstName')}
                    type="text"
                    required
                    className="w-full bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8b55ff]/50 focus:border-[#8b55ff] transition-all duration-300 hover:shadow-md text-black placeholder-black/50"
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600 animate-shake">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="animate-fadeIn delay-100">
                  <label className="block text-sm font-semibold mb-2 text-black">Last Name</label>
                  <input
                    {...register('lastName')}
                    type="text"
                    required
                    className="w-full bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8b55ff]/50 focus:border-[#8b55ff] transition-all duration-300 hover:shadow-md text-black placeholder-black/50"
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600 animate-shake">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div className="animate-fadeIn delay-200">
                <label className="block text-sm font-semibold mb-2 text-black">Email Address</label>
                <input
                  {...register('email')}
                  type="email"
                  required
                  className="w-full bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8b55ff]/50 focus:border-[#8b55ff] transition-all duration-300 hover:shadow-md text-black placeholder-black/50"
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 animate-shake">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="animate-fadeIn delay-300">
                <label className="block text-sm font-semibold mb-2 text-black">Password</label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? "text" : "password"}
                    required
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
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 animate-shake">{errors.password.message}</p>
                )}
              </div>

              {/* Role Selection */}
              <div className="animate-fadeIn delay-400">
                <label className="block text-sm font-semibold mb-2 text-black">Account Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'consumer', label: 'Consumer', icon: <Users className="h-4 w-4" /> },
                    { value: 'brand_owner', label: 'Brand Owner', icon: <Building className="h-4 w-4" /> },
                    { value: 'staff', label: 'Staff', icon: <UserPlus className="h-4 w-4" /> }
                  ].map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setValue('role', role.value)}
                      className={`p-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-center space-y-1 ${
                        selectedRole === role.value
                          ? 'border-[#8b55ff] bg-[#8b55ff]/10 text-[#8b55ff]'
                          : 'border-slate-200 bg-white/50 text-black/70 hover:border-[#8b55ff]/50 hover:bg-[#8b55ff]/5'
                      }`}
                    >
                      {role.icon}
                      <span className="text-xs font-medium">{role.label}</span>
                    </button>
                  ))}
                </div>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600 animate-shake">{errors.role.message}</p>
                )}
                {selectedRole === 'staff' && (
                  <p className="mt-2 text-xs text-blue-600 bg-blue-50 rounded-lg p-3">
                    Staff email must be in the format <b>staff1.[brandowner-email]</b> (e.g., staff1.adithyavedhamani2@gmail.com)
                  </p>
                )}
              </div>

              {/* Role Description */}
              <div className={`transition-all duration-500 ${selectedRole ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                <div className="flex items-center p-4 bg-slate-50 rounded-xl">
                  {getRoleIcon(selectedRole)}
                  <p className="ml-3 text-sm text-black/70">{getRoleDescription(selectedRole)}</p>
                </div>
              </div>

              {/* Company Name for Brand Owners */}
              {selectedRole === 'brand_owner' && (
                <div className="animate-fadeIn">
                  <label className="block text-sm font-semibold mb-2 text-black">Company Name</label>
                  <input
                    {...register('companyName')}
                    type="text"
                    className="w-full bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8b55ff]/50 focus:border-[#8b55ff] transition-all duration-300 hover:shadow-md text-black placeholder-black/50"
                    placeholder="Your Company Name"
                  />
                </div>
              )}

              {/* Phone Number */}
              <div className="animate-fadeIn delay-500">
                <label className="block text-sm font-semibold mb-2 text-black">Phone Number</label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="w-full bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8b55ff]/50 focus:border-[#8b55ff] transition-all duration-300 hover:shadow-md text-black placeholder-black/50"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#8b55ff] to-[#7c3aed] text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:transform-none active:scale-95"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="text-center text-black/70 mb-4">
                Already have an account?{' '}
                <Link href="/login" className="text-[#8b55ff] hover:text-[#7c3aed] font-semibold transition-colors duration-300 hover:underline">
                  Sign in here
                </Link>
              </div>
              
              <div className="text-xs text-black/50 text-center">
                By creating an account, you agree to our{' '}
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
        
        .delay-200 {
          animation-delay: 0.2s;
        }
        
        .delay-300 {
          animation-delay: 0.3s;
        }
        
        .delay-400 {
          animation-delay: 0.4s;
        }
        
        .delay-500 {
          animation-delay: 0.5s;
        }
      `}</style>
    </div>
  );
} 