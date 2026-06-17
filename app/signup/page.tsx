'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import ThreeBackground from '@/components/ThreeBackground';
import { gsap } from 'gsap';
import { Eye, EyeOff, Vote, CheckCircle, AlertCircle, UserPlus, Sparkles } from 'lucide-react';

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    cnic: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate card entrance
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        { y: 100, opacity: 0, scale: 0.8, rotationX: 45 },
        { y: 0, opacity: 1, scale: 1, rotationX: 0, duration: 1.2, ease: "back.out(1.7)" }
      );
    }
  }, []);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    // CNIC validation
    if (!formData.cnic) {
      newErrors.cnic = 'CNIC is required';
    } else if (!/^\d{5}-\d{7}-\d{1}$/.test(formData.cnic)) {
      newErrors.cnic = 'CNIC format should be XXXXX-XXXXXXX-X (e.g., 12345-1234567-1)';
    }
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (formData.password.length < 8) {
      newErrors.password = 'For better security, use at least 8 characters';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      // Shake animation for errors
      if (formRef.current) {
        gsap.to(formRef.current, { x: -10, duration: 0.1, yoyo: true, repeat: 5 });
      }
      return;
    }
    
    setIsLoading(true);
    
    // Loading animation
    if (cardRef.current) {
      gsap.to(cardRef.current, { scale: 1.02, duration: 0.5, yoyo: true, repeat: -1 });
    }
    
    try {
      // Use API route with Admin SDK
      const { SignupService } = await import('@/services/signup-service');
      
      const result = await SignupService.signUp({
        name: formData.name,
        cnic: formData.cnic,
        email: formData.email,
        password: formData.password,
      });
      
      gsap.killTweensOf(cardRef.current);
      gsap.set(cardRef.current, { scale: 1 });
      
      if (result.success) {
        // Success animation with confetti effect
        setIsSuccess(true);
        
        if (cardRef.current) {
          gsap.to(cardRef.current, { 
            scale: 1.1, 
            rotation: 360, 
            duration: 1,
            ease: "back.out(1.7)",
            onComplete: () => {
              setTimeout(() => {
                router.push('/signin');
              }, 2000);
            }
          });
        }
      } else {
        // Handle specific error types
        const errorMessage = result.error || 'Registration failed';
        
        // Check for specific conflict errors
        if (errorMessage.includes('email already exists')) {
          setErrors({ 
            email: 'This email is already registered.',
            general: 'An account with this email already exists. Try signing in instead or use a different email address.'
          });
        } else if (errorMessage.includes('CNIC already exists')) {
          setErrors({ 
            cnic: 'This CNIC is already registered.',
            general: 'An account with this CNIC already exists. Please use a different CNIC number.'
          });
        } else if (errorMessage.includes('Invalid email')) {
          setErrors({ email: 'Please enter a valid email address.' });
        } else if (errorMessage.includes('Password is too weak')) {
          setErrors({ password: 'Password is too weak. Please choose a stronger password with at least 6 characters.' });
        } else {
          // General error
          setErrors({ general: errorMessage });
        }
        
        if (cardRef.current) {
          gsap.to(cardRef.current, { x: -10, duration: 0.1, yoyo: true, repeat: 5 });
        }
      }
    } catch (error) {
      console.error('Sign up error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
      if (cardRef.current) {
        gsap.to(cardRef.current, { x: -10, duration: 0.1, yoyo: true, repeat: 5 });
      }
    }
    
    setIsLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Clear general error when user makes any change
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
    
    // Real-time validation for specific fields
    if (field === 'email' && value) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      }
    }
    
    if (field === 'cnic' && value) {
      if (!/^\d{5}-\d{7}-\d{1}$/.test(value)) {
        setErrors(prev => ({ ...prev, cnic: 'CNIC format should be XXXXX-XXXXXXX-X (e.g., 12345-1234567-1)' }));
      }
    }
    
    if (field === 'confirmPassword' && value && formData.password) {
      if (value !== formData.password) {
        setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      }
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    gsap.to(e.target, { scale: 1.02, duration: 0.2 });
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    gsap.to(e.target, { scale: 1, duration: 0.2 });
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-dark-primary">
        <ThreeBackground variant="ledger" />
        <Navigation />
        
        <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
          <Card ref={cardRef} className="w-full max-w-md relative z-10 glass-card border-green-500/30 text-center">
            <CardContent className="p-12">
              <div className="flex items-center justify-center mb-8">
                <div className="p-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full neon-glow pulse-glow">
                  <CheckCircle className="h-16 w-16 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-6">
                Registration Successful!
              </h2>
              <p className="text-gray-300 mb-8 text-lg">
                Your account has been created successfully. You will be redirected to the sign-in page shortly.
              </p>
              <Button 
                onClick={() => router.push('/signin')} 
                className="w-full py-3 text-lg purple-gradient hover:scale-105 transition-all duration-300 neon-glow"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Continue to Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-primary">
      <ThreeBackground variant="grid" />
      <Navigation />
      
      <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="cyber-grid absolute inset-0 opacity-10"></div>
        
        <Card ref={cardRef} className="w-full max-w-md relative z-10 glass-card border-blockchain-primary/30 cyber-border">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 purple-gradient rounded-full neon-glow pulse-glow">
                <Vote className="h-10 w-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold gradient-text neon-text">Join Vote Ledger</CardTitle>
            <p className="text-gray-400 mt-3 text-lg">
              Create your secure voting account
            </p>
          </CardHeader>
          
          <CardContent className="space-y-5">
            <div ref={formRef} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Full Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  className={`bg-dark-secondary/50 border-blockchain-primary/30 text-white placeholder-gray-500 focus:border-blockchain-primary focus:ring-blockchain-primary/20 transition-all duration-300 ${
                    errors.name ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''
                  }`}
                />
                {errors.name && (
                  <p className="text-sm text-red-400 animate-slide-up">{errors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  CNIC Number
                </label>
                <Input
                  type="text"
                  placeholder="12345-1234567-1"
                  value={formData.cnic}
                  onChange={(e) => handleInputChange('cnic', e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  className={`bg-dark-secondary/50 border-blockchain-primary/30 text-white placeholder-gray-500 focus:border-blockchain-primary focus:ring-blockchain-primary/20 transition-all duration-300 ${
                    errors.cnic ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''
                  }`}
                />
                {errors.cnic && (
                  <p className="text-sm text-red-400 animate-slide-up">{errors.cnic}</p>
                )}
                {!errors.cnic && formData.cnic && /^\d{5}-\d{7}-\d{1}$/.test(formData.cnic) && (
                  <p className="text-sm text-green-400 animate-slide-up">✓ Valid CNIC format</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  className={`bg-dark-secondary/50 border-blockchain-primary/30 text-white placeholder-gray-500 focus:border-blockchain-primary focus:ring-blockchain-primary/20 transition-all duration-300 ${
                    errors.email ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''
                  }`}
                />
                {errors.email && (
                  <p className="text-sm text-red-400 animate-slide-up">{errors.email}</p>
                )}
                {!errors.email && formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                  <p className="text-sm text-green-400 animate-slide-up">✓ Valid email format</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className={`bg-dark-secondary/50 border-blockchain-primary/30 text-white placeholder-gray-500 focus:border-blockchain-primary focus:ring-blockchain-primary/20 transition-all duration-300 ${
                      errors.password ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blockchain-accent transition-colors duration-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-400 animate-slide-up">{errors.password}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className={`bg-dark-secondary/50 border-blockchain-primary/30 text-white placeholder-gray-500 focus:border-blockchain-primary focus:ring-blockchain-primary/20 transition-all duration-300 ${
                      errors.confirmPassword ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blockchain-accent transition-colors duration-300"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-400 animate-slide-up">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
            
            {/* General Error Display */}
            {errors.general && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 animate-slide-up">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <p className="text-sm text-red-400 font-medium">{errors.general}</p>
                </div>
                {errors.general.includes('email already exists') && (
                  <div className="mt-3 flex space-x-2">
                    <Link 
                      href="/signin"
                      className="text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1 rounded-md transition-colors duration-300"
                    >
                      Sign In Instead
                    </Link>
                    <button 
                      onClick={() => setFormData(prev => ({ ...prev, email: '' }))}
                      className="text-xs bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 px-3 py-1 rounded-md transition-colors duration-300"
                    >
                      Use Different Email
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full py-3 text-lg purple-gradient hover:scale-105 transition-all duration-300 neon-glow"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <UserPlus className="h-5 w-5" />
                  <span>Create Account</span>
                </div>
              )}
            </Button>
            
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
              <span>Already have an account?</span>
              <Link 
                href="/signin" 
                className="text-blockchain-accent hover:text-blockchain-secondary transition-colors duration-300 font-medium hover:underline"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}