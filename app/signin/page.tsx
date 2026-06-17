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
import { Eye, EyeOff, Vote, AlertCircle, Zap } from 'lucide-react';

export default function SignIn() {
  const [formData, setFormData] = useState({
    cnic: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate card entrance
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        { y: 100, opacity: 0, scale: 0.8, rotationY: 45 },
        { y: 0, opacity: 1, scale: 1, rotationY: 0, duration: 1, ease: "back.out(1.7)" }
      );
    }
  }, []);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.cnic) {
      newErrors.cnic = 'CNIC is required';
    } else if (!/^\d{5}-\d{7}-\d{1}$/.test(formData.cnic)) {
      newErrors.cnic = 'CNIC format should be XXXXX-XXXXXXX-X';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
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
      gsap.to(cardRef.current, { scale: 1.02, duration: 0.3, yoyo: true, repeat: -1 });
    }
    
    try {
      // Import SigninService to use API route with Admin SDK
      const { SigninService } = await import('@/services/signin-service');
      
      const result = await SigninService.signIn({
        cnic: formData.cnic,
        password: formData.password,
      });
      
      gsap.killTweensOf(cardRef.current);
      gsap.set(cardRef.current, { scale: 1 });
      
      if (result.success && result.user) {
        // User data is automatically stored by SigninService
        
        // Success animation
        if (cardRef.current) {
          gsap.to(cardRef.current, { 
            scale: 1.1, 
            rotation: 5, 
            duration: 0.3,
            onComplete: () => {
              gsap.to(cardRef.current, { 
                y: -50, 
                opacity: 0, 
                duration: 0.5,
                onComplete: () => router.push('/profile')
              });
            }
          });
        }
      } else {
        setErrors({ general: result.error || 'Sign in failed' });
        // Error shake animation
        if (cardRef.current) {
          gsap.to(cardRef.current, { x: -10, duration: 0.1, yoyo: true, repeat: 5 });
        }
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
      if (cardRef.current) {
        gsap.killTweensOf(cardRef.current);
        gsap.set(cardRef.current, { scale: 1 });
        gsap.to(cardRef.current, { x: -10, duration: 0.1, yoyo: true, repeat: 5 });
      }
    }
    
    setIsLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    gsap.to(e.target, { scale: 1.02, duration: 0.2 });
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    gsap.to(e.target, { scale: 1, duration: 0.2 });
  };

  return (
    <div className="min-h-screen bg-dark-primary">
      <ThreeBackground variant="particles" />
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
            <CardTitle className="text-3xl font-bold gradient-text neon-text">Sign In to Vote Ledger</CardTitle>
            <p className="text-gray-400 mt-3 text-lg">
              Access your secure voting account
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {errors.general && (
              <div className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg animate-slide-up">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <span className="text-sm text-red-400">{errors.general}</span>
              </div>
            )}
            
            <div className="space-y-6">
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
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
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
            </div>
            
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full py-3 text-lg purple-gradient hover:scale-105 transition-all duration-300 neon-glow"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Sign In</span>
                </div>
              )}
            </Button>
            
            <div className="text-center space-y-4">
              <Link 
                href="/forgot-password" 
                className="text-sm text-blockchain-accent hover:text-blockchain-secondary transition-colors duration-300 hover:underline"
              >
                Forgot your password?
              </Link>
              
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                <span>Don't have an account?</span>
                <Link 
                  href="/signup" 
                  className="text-blockchain-accent hover:text-blockchain-secondary transition-colors duration-300 font-medium hover:underline"
                >
                  Sign up
                </Link>
              </div>
            </div>
            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}