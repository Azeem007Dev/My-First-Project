'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Navigation from '@/components/Navigation';
import ThreeBackground from '@/components/ThreeBackground';
import { gsap } from 'gsap';
import { User, Mail, CreditCard, Shield, Edit, Settings, Eye, Zap, Star, Loader2, RefreshCw } from 'lucide-react';
import { UserService } from '@/services';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  name: string;
  cnic: string;
  email: string;
  isAdmin: boolean;
  registrationDate?: string;
  lastLogin?: string;
  votingHistory?: number;
}

export default function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', email: '' });
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Function to refresh profile data
  const refreshProfileData = async () => {
    console.log('Refresh button clicked - starting refresh...');
    setIsRefreshing(true);
    
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('idToken');
      if (!token) {
        console.log('No auth token found');
        toast({
          title: 'Authentication Required',
          description: 'Please sign in again to refresh your profile',
          variant: 'destructive',
        });
        router.push('/signin');
        return;
      }
      
      console.log('Calling UserService.getProfile()...');
      const response = await UserService.getProfile();
      console.log('Refresh response:', response);
      
      if (response.success && response.profile) {
        console.log('Profile refresh successful:', response.profile);
        setUser(response.profile);
        toast({
          title: 'Profile Updated',
          description: 'Your profile information has been refreshed',
          className: 'bg-green-500/10 border-green-500/50',
        });
      } else {
        console.log('Profile refresh failed:', response.error);
        toast({
          title: 'Refresh Failed',
          description: response.error || 'Could not refresh profile data',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error refreshing profile:', error);
      toast({
        title: 'Refresh Failed',
        description: error.message || 'Could not refresh profile data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const loadUserProfile = async () => {
      const userData = localStorage.getItem('user');
      if (!userData) {
        router.push('/signin');
        return;
      }
      
      // Try to fetch fresh profile data from API
      try {
        const response = await UserService.getProfile();
        if (response.success && response.profile) {
          setUser(response.profile);
        } else {
          // Fallback to localStorage data with real dates
          const parsedUser = JSON.parse(userData);
          setUser({
            ...parsedUser,
            registrationDate: parsedUser.createdAt ? new Date(parsedUser.createdAt).toISOString().split('T')[0] : 'Unknown',
            lastLogin: new Date().toISOString().split('T')[0],
            votingHistory: 0 // Will be updated by API when available
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        // Fallback to localStorage data with real dates
        const parsedUser = JSON.parse(userData);
        setUser({
          ...parsedUser,
          registrationDate: parsedUser.createdAt ? new Date(parsedUser.createdAt).toISOString().split('T')[0] : 'Unknown',
          lastLogin: new Date().toISOString().split('T')[0],
          votingHistory: 0 // Will be updated by API when available
        });
      }
      
      setIsLoading(false);
    };

    loadUserProfile();

    // Animate profile sections
    const tl = gsap.timeline();
    
    if (profileRef.current) {
      tl.fromTo(profileRef.current,
        { y: 100, opacity: 0, scale: 0.8 },
        { y: 0, opacity: 1, scale: 1, duration: 1, ease: "back.out(1.7)" }
      );
    }

    if (statsRef.current) {
      tl.fromTo(statsRef.current.children,
        { x: -50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" },
        "-=0.5"
      );
    }

    if (actionsRef.current) {
      tl.fromTo(actionsRef.current.children,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" },
        "-=0.3"
      );
    }
  }, [router]);

  // Handle opening edit dialog
  const handleOpenEditDialog = () => {
    if (user) {
      setEditFormData({
        name: user.name,
        email: user.email,
      });
      setIsEditDialogOpen(true);
    }
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!editFormData.name.trim() || !editFormData.email.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Name and email are required',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);

    try {
      const response = await UserService.updateProfile({
        name: editFormData.name.trim(),
        email: editFormData.email.trim(),
      });

      if (response.success && response.profile) {
        setUser(response.profile);
        setIsEditDialogOpen(false);
        
        toast({
          title: 'Success!',
          description: 'Your profile has been updated successfully.',
          className: 'bg-green-500/10 border-green-500/50',
        });
      } else {
        toast({
          title: 'Update Failed',
          description: response.error || 'Failed to update profile',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred while updating profile',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-primary">
        <ThreeBackground variant="minimal" />
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blockchain-primary mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const profileStats = [
    { label: 'Elections Participated', value: user.votingHistory?.toString() || '0', icon: Eye, color: 'text-blue-400' },
    { label: 'Account Status', value: 'Active', icon: Shield, color: 'text-green-400' },
    { label: 'Member Since', value: user.registrationDate || 'Unknown', icon: CreditCard, color: 'text-purple-400' },
    { label: 'Last Login', value: user.lastLogin || 'Today', icon: User, color: 'text-orange-400' }
  ];

  return (
    <div className="min-h-screen bg-dark-primary">
      <ThreeBackground variant="minimal" />
      <Navigation />
      
      <div className="relative min-h-[calc(100vh-4rem)]">
        <div className="particle-bg absolute inset-0 opacity-20"></div>
        
        <div className="relative max-w-6xl mx-auto p-4 py-8 z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 purple-gradient rounded-full mb-6 neon-glow pulse-glow">
              <User className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold gradient-text neon-text mb-4">
              Welcome back, {user.name}!
            </h1>
            <p className="text-gray-400 text-lg mb-6">Manage your Vote Ledger account and voting preferences</p>
            
            {/* Refresh Button */}
            <Button 
              onClick={refreshProfileData}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="border-blockchain-primary/30 text-blockchain-accent hover:bg-blockchain-primary/10 hover:border-blockchain-primary/50 transition-all duration-300"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Profile Data'}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-2">
              <Card ref={profileRef} className="glass-card border-blockchain-primary/30 cyber-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3 text-2xl">
                    <User className="h-6 w-6 text-blockchain-primary" />
                    <span className="gradient-text">Profile Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-400">Full Name</label>
                      <div className="p-4 bg-dark-secondary/50 rounded-lg border border-blockchain-primary/20 hover:border-blockchain-primary/40 transition-all duration-300">
                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5 text-blockchain-accent" />
                          <span className="text-white text-lg">{user.name}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-400">CNIC Number</label>
                      <div className="p-4 bg-dark-secondary/50 rounded-lg border border-blockchain-primary/20 hover:border-blockchain-primary/40 transition-all duration-300">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="h-5 w-5 text-blockchain-accent" />
                          <span className="text-white text-lg">{user.cnic}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-400">Email Address</label>
                      <div className="p-4 bg-dark-secondary/50 rounded-lg border border-blockchain-primary/20 hover:border-blockchain-primary/40 transition-all duration-300">
                        <div className="flex items-center space-x-3">
                          <Mail className="h-5 w-5 text-blockchain-accent" />
                          <span className="text-white text-lg">{user.email}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-400">Account Type</label>
                      <div className="p-4 bg-dark-secondary/50 rounded-lg border border-blockchain-primary/20 hover:border-blockchain-primary/40 transition-all duration-300">
                        <div className="flex items-center space-x-3">
                          <Shield className={`h-5 w-5 ${user.isAdmin ? 'text-yellow-400' : 'text-green-400'}`} />
                          <span className={`font-medium text-lg ${user.isAdmin ? 'text-yellow-400' : 'text-green-400'}`}>
                            {user.isAdmin ? 'Administrator' : 'Voter'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <Button 
                      onClick={() => router.push('/change-password')}
                      className="group flex items-center space-x-2 purple-gradient hover:scale-105 transition-all duration-300 neon-glow"
                    >
                      <Settings className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                      <span>Change Password</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleOpenEditDialog}
                      className="flex items-center space-x-2 border-blockchain-primary/30 text-blockchain-accent hover:bg-blockchain-primary/10 hover:border-blockchain-primary/50 transition-all duration-300 hover:scale-105"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit Profile</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats & Quick Actions */}
            <div className="space-y-8">
              {/* Account Stats */}
              <Card className="glass-card border-blockchain-primary/30">
                <CardHeader>
                  <CardTitle className="text-xl gradient-text">Account Statistics</CardTitle>
                </CardHeader>
                <CardContent ref={statsRef} className="space-y-6">
                  {profileStats.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="flex items-center justify-between p-3 bg-dark-secondary/30 rounded-lg hover:bg-dark-secondary/50 transition-all duration-300">
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-5 w-5 ${color}`} />
                        <span className="text-sm text-gray-400">{label}</span>
                      </div>
                      <span className="text-sm font-medium text-white">{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="glass-card border-blockchain-primary/30">
                <CardHeader>
                  <CardTitle className="text-xl gradient-text">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent ref={actionsRef} className="space-y-4">
                  <Button 
                    onClick={() => router.push('/vote')}
                    className="w-full justify-start group purple-gradient hover:scale-105 transition-all duration-300 neon-glow"
                  >
                    <Zap className="h-4 w-4 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                    Cast Your Vote
                  </Button>
                  <Button 
                    onClick={() => router.push('/results')}
                    className="w-full justify-start border-blockchain-primary/30 text-blockchain-accent hover:bg-blockchain-primary/10 hover:border-blockchain-primary/50 transition-all duration-300" 
                    variant="outline"
                  >
                    <Eye className="h-4 w-4 mr-3" />
                    View Results
                  </Button>
                  {user.isAdmin && (
                    <Button 
                      onClick={() => router.push('/admin')}
                      className="w-full justify-start bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 hover:scale-105 transition-all duration-300 neon-glow"
                    >
                      <Shield className="h-4 w-4 mr-3" />
                      Admin Panel
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="glass-card border-blockchain-primary/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="gradient-text text-2xl flex items-center space-x-2">
              <Edit className="h-6 w-6 text-blockchain-primary" />
              <span>Edit Profile</span>
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Update your profile information. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-medium text-gray-300">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blockchain-accent" />
                <Input
                  id="edit-name"
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="pl-10 bg-dark-secondary/50 border-blockchain-primary/20 focus:border-blockchain-primary/50 text-white"
                  placeholder="Enter your full name"
                  disabled={isUpdating}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email" className="text-sm font-medium text-gray-300">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blockchain-accent" />
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="pl-10 bg-dark-secondary/50 border-blockchain-primary/20 focus:border-blockchain-primary/50 text-white"
                  placeholder="Enter your email"
                  disabled={isUpdating}
                />
              </div>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                <Shield className="inline h-4 w-4 mr-2" />
                Your CNIC cannot be changed for security reasons.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isUpdating}
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProfile}
              disabled={isUpdating}
              className="purple-gradient hover:scale-105 transition-all duration-300 neon-glow"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}