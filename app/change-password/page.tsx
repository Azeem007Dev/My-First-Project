'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import ThreeBackground from '@/components/ThreeBackground';
import { gsap } from 'gsap';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Shield, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserService } from '@/services';

interface User {
  name: string;
  email: string;
  cnic: string;
  isAdmin: boolean;
}

export default function ChangePassword() {
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/signin');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    console.log('Loaded user from localStorage:', parsedUser);
    setUser(parsedUser);

    // Animate card entrance
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        { y: 100, opacity: 0, scale: 0.8, rotationX: 45 },
        { y: 0, opacity: 1, scale: 1, rotationX: 0, duration: 1.2, ease: "back.out(1.7)" }
      );
    }
  }, [router]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'New password must be at least 6 characters';
    } else if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    // Enhanced password validation
    const hasUpperCase = /[A-Z]/.test(formData.newPassword);
    const hasLowerCase = /[a-z]/.test(formData.newPassword);
    const hasNumber = /[0-9]/.test(formData.newPassword);
    
    if (formData.newPassword && (!hasUpperCase || !hasLowerCase || !hasNumber)) {
      newErrors.newPassword = 'Password must contain uppercase, lowercase, and number';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log('Button clicked! Starting password change process...');
    console.log('Form data:', formData);
    console.log('User:', user);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      // Shake animation for errors
      if (formRef.current) {
        gsap.to(formRef.current, { x: -10, duration: 0.1, yoyo: true, repeat: 5 });
      }
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }
    
    if (!user) {
      console.log('No user found');
      toast({
        title: 'Error',
        description: 'User not found. Please sign in again.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    // Loading animation
    if (cardRef.current) {
      gsap.to(cardRef.current, { scale: 1.02, duration: 0.5, yoyo: true, repeat: -1 });
    }
    
    try {
      console.log('Calling UserService to change password...');
      
      // Call the API to change password
      const response = await UserService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      console.log('Password change response:', response);

      if (response.success) {
        // Stop loading animation
        gsap.killTweensOf(cardRef.current);
        gsap.set(cardRef.current, { scale: 1 });
        
        setIsSuccess(true);
        setIsLoading(false);
        
        toast({
          title: 'Success!',
          description: response.message || 'Your password has been changed successfully',
          className: 'bg-green-500/10 border-green-500/50',
        });
        
        // Success animation
        if (cardRef.current) {
          gsap.to(cardRef.current, { 
            scale: 1.1, 
            rotation: 360, 
            duration: 1,
            ease: "back.out(1.7)",
            onComplete: () => {
              setTimeout(() => {
                router.push('/profile');
              }, 2000);
            }
          });
        }
      } else {
        // Handle API errors
        console.log('Password change failed:', response.error);
        
        // Stop loading animation
        gsap.killTweensOf(cardRef.current);
        gsap.set(cardRef.current, { scale: 1 });
        
        // Set specific field errors
        if (response.error?.includes('Current password')) {
          setErrors({ currentPassword: response.error });
        } else if (response.error?.includes('New password') || response.error?.includes('Password must')) {
          setErrors({ newPassword: response.error });
        }
        
        toast({
          title: 'Password Change Failed',
          description: response.error || 'Failed to change password',
          variant: 'destructive',
        });
        
        // Error shake animation
        if (cardRef.current) {
          gsap.to(cardRef.current, { x: -10, duration: 0.1, yoyo: true, repeat: 5 });
        }
        
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('Password change error:', error);
      
      // Stop loading animation
      if (cardRef.current) {
        gsap.killTweensOf(cardRef.current);
        gsap.set(cardRef.current, { scale: 1 });
      }
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password. Please try again.',
        variant: 'destructive',
      });
      
      // Error shake animation
      if (formRef.current) {
        gsap.to(formRef.current, { x: -10, duration: 0.1, yoyo: true, repeat: 5 });
      }
      
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    gsap.to(e.target, { scale: 1.02, duration: 0.2 });
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    gsap.to(e.target, { scale: 1, duration: 0.2 });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-primary">
        <ThreeBackground variant="minimal" />
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blockchain-primary"></div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-dark-primary">
        <ThreeBackground variant="particles" />
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
                Password Updated Successfully!
              </h2>
              <p className="text-gray-300 mb-8 text-lg">
                Your password has been changed successfully. You will be redirected to your profile.
              </p>
              <Button 
                onClick={() => router.push('/profile')} 
                className="w-full py-3 text-lg purple-gradient hover:scale-105 transition-all duration-300 neon-glow"
              >
                <Zap className="h-5 w-5 mr-2" />
                Continue to Profile
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
                <Lock className="h-10 w-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold gradient-text neon-text">Change Password</CardTitle>
            <p className="text-gray-400 mt-3 text-lg">
              Update your account password for {user.name}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div ref={formRef} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Current Password
                </label>
                <div className="relative">
                  <Input
                    type={showPasswords.current ? 'text' : 'password'}
                    placeholder="Enter your current password"
                    value={formData.currentPassword}
                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className={`bg-dark-secondary/50 border-blockchain-primary/30 text-white placeholder-gray-500 focus:border-blockchain-primary focus:ring-blockchain-primary/20 transition-all duration-300 ${
                      errors.currentPassword ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blockchain-accent transition-colors duration-300"
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-sm text-red-400 animate-slide-up">{errors.currentPassword}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showPasswords.new ? 'text' : 'password'}
                    placeholder="Enter your new password"
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className={`bg-dark-secondary/50 border-blockchain-primary/30 text-white placeholder-gray-500 focus:border-blockchain-primary focus:ring-blockchain-primary/20 transition-all duration-300 ${
                      errors.newPassword ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blockchain-accent transition-colors duration-300"
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-sm text-red-400 animate-slide-up">{errors.newPassword}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    placeholder="Confirm your new password"
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
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blockchain-accent transition-colors duration-300"
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-400 animate-slide-up">{errors.confirmPassword}</p>
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
                  <span>Updating Password...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Update Password</span>
                </div>
              )}
            </Button>
            
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={() => router.push('/profile')}
                className="w-full border-blockchain-primary/30 text-blockchain-accent hover:bg-blockchain-primary/10 hover:border-blockchain-primary/50 transition-all duration-300"
              >
                Cancel
              </Button>
            </div>
            
            {/* Password Requirements */}
            <div className="bg-blue-500/10 p-6 rounded-lg border border-blue-500/30">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="text-blue-300">
                  <p className="font-medium mb-2">Password Requirements:</p>
                  <ul className="text-sm space-y-1">
                    <li className={formData.newPassword.length >= 6 ? 'text-green-400' : ''}>
                      • At least 6 characters
                    </li>
                    <li className={/[A-Z]/.test(formData.newPassword) ? 'text-green-400' : ''}>
                      • One uppercase letter (A-Z)
                    </li>
                    <li className={/[a-z]/.test(formData.newPassword) ? 'text-green-400' : ''}>
                      • One lowercase letter (a-z)
                    </li>
                    <li className={/[0-9]/.test(formData.newPassword) ? 'text-green-400' : ''}>
                      • One number (0-9)
                    </li>
                    <li className={formData.newPassword && formData.newPassword !== formData.currentPassword ? 'text-green-400' : ''}>
                      • Different from current password
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}