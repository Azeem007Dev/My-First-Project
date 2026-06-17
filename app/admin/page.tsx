'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import ThreeBackground from '@/components/ThreeBackground';
import { gsap } from 'gsap';
import { 
  Shield, 
  Users, 
  Plus, 
  Play, 
  Square, 
  Upload, 
  CheckCircle, 
  Clock,
  Eye,
  BarChart3,
  UserPlus,
  Edit,
  Trash2,
  Loader2,
  Hash,
  X,
  Sparkles,
  Zap,
  TrendingUp,
  Activity,
  Target,
  Calendar,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { 
  AdminCandidatesService, 
  AdminCandidate, 
  AdminCreateCandidateRequest,
  AdminElectionsService,
  AdminElection,
  AdminCreateElectionRequest,
  AdminStatsResponse
} from '@/services';
import { useToast } from '@/hooks/use-toast';

// Dynamic import for emoji picker to avoid SSR issues
const EmojiPicker = dynamic(
  () => import('emoji-picker-react'),
  { ssr: false }
);

interface User {
  name: string;
  cnic: string;
  isAdmin: boolean;
}


interface ElectionStats {
  totalVoters: number;
  totalVotes: number;
  turnoutPercentage: number;
  status: 'upcoming' | 'active' | 'ended';
}

interface AdminStats {
  overview: {
    totalUsers: number;
    totalElections: number;
    totalVotesAllTime: number;
    totalCandidates: number;
    userGrowthPercentage: number;
    newUsersThisMonth: number;
  };
  activeElection: {
    totalVotes: number;
    totalVoters: number;
    turnoutPercentage: number;
    status: 'upcoming' | 'active' | 'ended';
    electionTitle: string;
    electionId: string | null;
  };
  system: {
    uptimePercentage: number;
    databaseStatus: string;
    blockchainStatus: string;
  };
}

export default function AdminPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [candidates, setCandidates] = useState<AdminCandidate[]>([]);
  const [elections, setElections] = useState<AdminElection[]>([]);
  const [activeElection, setActiveElection] = useState<AdminElection | null>(null);
  const [electionStats, setElectionStats] = useState<ElectionStats>({
    totalVoters: 0,
    totalVotes: 0,
    turnoutPercentage: 0,
    status: 'upcoming'
  });
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [newCandidate, setNewCandidate] = useState<AdminCreateCandidateRequest>({
    name: '',
    party: '',
    symbol: '',
    description: ''
  });
  const [editingCandidate, setEditingCandidate] = useState<AdminCandidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState<{[electionId: string]: string | null}>({});
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [electionLoading, setElectionLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [newElection, setNewElection] = useState<AdminCreateElectionRequest>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    candidates: []
  });
  const [editingElection, setEditingElection] = useState<AdminElection | null>(null);
  const [updateElectionLoading, setUpdateElectionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });
  const [blockchainStats, setBlockchainStats] = useState<any>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const candidatesRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Load candidates from API
  const loadCandidates = async () => {
    try {
      setCandidateLoading(true);
      const response = await AdminCandidatesService.getCandidates();
      
      if (response.success && response.candidates) {
        setCandidates(response.candidates);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to load candidates',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error loading candidates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load candidates',
        variant: 'destructive',
      });
    } finally {
      setCandidateLoading(false);
    }
  };

  // Load admin stats from API
  const loadAdminStats = async (showLoading = false) => {
    try {
      if (showLoading) setStatsLoading(true);
      
      const response = await AdminElectionsService.getAdminStats();
      
      if (response.success && response.stats) {
        setAdminStats(response.stats);
        
        // Update election stats with overall data (not just active election)
        setElectionStats({
          totalVoters: response.stats.overview.totalUsers,
          totalVotes: response.stats.overview.totalVotesAllTime,
          turnoutPercentage: response.stats.activeElection.turnoutPercentage,
          status: response.stats.activeElection.status,
        });
        
        if (showLoading) {
          toast({
            title: 'Success',
            description: 'Stats refreshed successfully',
            className: 'bg-green-500/10 border-green-500/50',
          });
        }
      } else {
        console.error('Failed to load admin stats:', response.error);
        if (showLoading) {
          toast({
            title: 'Error',
            description: response.error || 'Failed to load statistics',
            variant: 'destructive',
          });
        }
      }
    } catch (error: any) {
      console.error('Error loading admin stats:', error);
      if (showLoading) {
        toast({
          title: 'Error',
          description: 'Failed to load statistics',
          variant: 'destructive',
        });
      }
    } finally {
      if (showLoading) setStatsLoading(false);
    }
  };

  // Load elections from API
  const loadElections = async (showLoading = false) => {
    try {
      if (showLoading) setRefreshLoading(true);
      
      console.log('Loading elections...');
      const response = await AdminElectionsService.getElections();
      console.log('Elections response:', response);
      
      if (response.success && response.elections) {
        setElections(response.elections);
        
        // Find active election
        const active = response.elections.find(e => e.status === 'active');
        setActiveElection(active || null);
        
        // Update stats from active election or first election
        const electionForStats = active || response.elections[0];
        if (electionForStats) {
          setElectionStats({
            totalVoters: electionForStats.totalVoters || 0,
            totalVotes: electionForStats.totalVotes || 0,
            turnoutPercentage: electionForStats.turnoutPercentage || 0,
            status: electionForStats.status,
          });
        }
        
        if (showLoading) {
          toast({
            title: 'Success',
            description: 'Elections refreshed successfully',
            className: 'bg-green-500/10 border-green-500/50',
          });
        }
      } else {
        console.error('Failed to load elections:', response.error);
        if (showLoading) {
          toast({
            title: 'Error',
            description: response.error || 'Failed to load elections',
            variant: 'destructive',
          });
        }
      }
    } catch (error: any) {
      console.error('Error loading elections:', error);
      if (showLoading) {
        toast({
          title: 'Error',
          description: 'Failed to refresh elections',
          variant: 'destructive',
        });
      }
    } finally {
      if (showLoading) setRefreshLoading(false);
    }
  };

  // Comprehensive refresh function that reloads all data
  const handleRefreshAll = async () => {
    try {
      setRefreshLoading(true);
      
      toast({
        title: 'Refreshing Data',
        description: 'Reloading all election and system data...',
        className: 'bg-blue-500/10 border-blue-500/50',
      });

      // Load all data in parallel for better performance
      await Promise.all([
        loadElections(false),
        loadCandidates(),
        loadAdminStats(),
        loadBlockchainStats()
      ]);

      toast({
        title: 'Refresh Complete',
        description: 'All data has been successfully refreshed',
        className: 'bg-green-500/10 border-green-500/50',
      });
      
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: 'Refresh Error',
        description: 'Some data may not have refreshed properly',
        variant: 'destructive',
      });
    } finally {
      setRefreshLoading(false);
    }
  };

  // Refresh election statistics specifically
  const handleRefreshStats = async () => {
    try {
      setRefreshLoading(true);
      
      const token = localStorage.getItem('idToken');
      if (!token) {
        toast({
          title: 'Error',
          description: 'No authentication token found',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Refreshing Statistics',
        description: 'Recalculating vote counts and turnout...',
        className: 'bg-blue-500/10 border-blue-500/50',
      });

      const response = await fetch('/api/admin/elections/refresh-stats', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Statistics Refreshed',
          description: 'Vote counts and turnout have been recalculated',
          className: 'bg-green-500/10 border-green-500/50',
        });
        
        // Reload elections to show updated stats
        await loadElections(false);
        await loadAdminStats();
      } else {
        toast({
          title: 'Refresh Failed',
          description: data.error || 'Failed to refresh statistics',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error refreshing statistics:', error);
      toast({
        title: 'Refresh Error',
        description: 'Failed to refresh statistics',
        variant: 'destructive',
      });
    } finally {
      setRefreshLoading(false);
    }
  };

  // Force close all active elections (for testing)
  const handleForceCloseAll = async () => {
    try {
      setRefreshLoading(true);
      
      const token = localStorage.getItem('idToken');
      if (!token) {
        toast({
          title: 'Error',
          description: 'No authentication token found',
          variant: 'destructive',
        });
        return;
      }

      if (!window.confirm('Are you sure you want to force close all active elections? This action cannot be undone.')) {
        return;
      }

      toast({
        title: 'Force Closing Elections',
        description: 'Closing all active elections...',
        className: 'bg-orange-500/10 border-orange-500/50',
      });

      const response = await fetch('/api/admin/elections/force-close-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Elections Closed',
          description: `Successfully closed ${data.closedCount} active elections`,
          className: 'bg-green-500/10 border-green-500/50',
        });
        
        // Reload elections to show updated status
        await loadElections(false);
        await loadAdminStats();
      } else {
        toast({
          title: 'Force Close Failed',
          description: data.error || 'Failed to force close elections',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error force closing elections:', error);
      toast({
        title: 'Force Close Error',
        description: 'Failed to force close elections',
        variant: 'destructive',
      });
    } finally {
      setRefreshLoading(false);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/signin');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    if (!parsedUser.isAdmin) {
      router.push('/');
      return;
    }
    
    setUser(parsedUser);
    
    // Load data from API
    loadCandidates();
    loadElections();
    loadAdminStats();
    loadBlockchainStats();
    
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Real-time updates for elections and automatic timing
  useEffect(() => {
    if (!user) return;

    // Update current time every second for live timers
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Check election timing every 30 seconds
    const electionInterval = setInterval(async () => {
      // Only refresh if not currently loading
      if (!refreshLoading && !electionLoading && !statsLoading) {
        await loadElections();
        await loadAdminStats();
        await checkElectionTiming();
      }
    }, 10000); // Refresh every 10 seconds instead of 30

    return () => {
      clearInterval(timeInterval);
      clearInterval(electionInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, refreshLoading, electionLoading]);

  // Check election timing and automatically start/end elections based on scheduled times
  const checkElectionTiming = async () => {
    try {
      let hasChanges = false;
      const now = new Date();

      for (const election of elections) {
        if (!election.id) {
          console.warn('Election missing ID:', election.title);
          continue;
        }

        const timing = getElectionTiming(election);
        
        // Debug logging
        console.log(`Election ${election.title} (${election.status}):`, {
          shouldAutoStart: timing.shouldAutoStart,
          shouldAutoEnd: timing.shouldAutoEnd,
          canStart: timing.canStart,
          canEnd: timing.canEnd,
          timeUntilStart: timing.timeUntilStart,
          timeUntilEnd: timing.timeUntilEnd,
          currentTime: now.toISOString(),
          startTime: timing.startDate.toISOString(),
          endTime: timing.endDate.toISOString()
        });

        // Auto-start election if scheduled start time has passed and status is upcoming
        if (timing.shouldAutoStart) {
          console.log('🚀 Auto-starting election:', election.title);
          try {
            const response = await AdminElectionsService.updateElectionStatus(election.id, 'active');
            console.log('Auto-start response:', response);
            if (response.success) {
              hasChanges = true;
              toast({
                title: 'Election Auto-Started',
                description: `${election.title} has been automatically started`,
                className: 'bg-green-500/10 border-green-500/50',
              });
            } else {
              console.error('Auto-start failed:', response.error);
              toast({
                title: 'Auto-Start Failed',
                description: response.error || 'Failed to auto-start election',
                variant: 'destructive',
              });
            }
          } catch (error) {
            console.error('Auto-start error:', error);
            toast({
              title: 'Auto-Start Error',
              description: 'An error occurred while auto-starting the election',
              variant: 'destructive',
            });
          }
        }

        // Auto-end election if scheduled end time has passed and status is active
        if (timing.shouldAutoEnd) {
          console.log('⏰ Auto-ending election:', election.title);
          try {
            const response = await AdminElectionsService.updateElectionStatus(election.id, 'ended');
            console.log('Auto-end response:', response);
            if (response.success) {
              hasChanges = true;
              toast({
                title: 'Election Auto-Ended',
                description: `${election.title} has been automatically closed`,
                className: 'bg-blue-500/10 border-blue-500/50',
              });
            } else {
              console.error('Auto-end failed:', response.error);
              toast({
                title: 'Auto-End Failed',
                description: response.error || 'Failed to auto-end election',
                variant: 'destructive',
              });
            }
          } catch (error) {
            console.error('Auto-end error:', error);
            toast({
              title: 'Auto-End Error',
              description: 'An error occurred while auto-ending the election',
              variant: 'destructive',
            });
          }
        }
      }

      // Reload elections if any changes were made
      if (hasChanges) {
        console.log('🔄 Reloading elections due to status changes');
        try {
          await loadElections(false);
          await loadAdminStats();
        } catch (error) {
          console.error('Error refreshing after auto-start/end:', error);
        }
      }
    } catch (error) {
      console.error('Error checking election timing:', error);
    }
  };

  // GSAP animations
  useEffect(() => {
    if (!isLoading) {
      const tl = gsap.timeline();
      
      if (headerRef.current) {
        tl.from(headerRef.current, {
          y: -50,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out"
        });
      }
      
      if (statsRef.current) {
        tl.from(statsRef.current.children, {
          y: 30,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out"
        }, "-=0.4");
      }
      
      if (candidatesRef.current) {
        tl.from(candidatesRef.current, {
          y: 30,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out"
        }, "-=0.2");
      }
    }
  }, [isLoading, activeTab]);

// Close emoji picker when clicking outside or scrolling
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (emojiPickerRef.current && 
        !emojiPickerRef.current.contains(event.target as Node) &&
        !emojiButtonRef.current?.contains(event.target as Node)) {
      setShowEmojiPicker(false);
    }
  };

  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setShowEmojiPicker(false);
    }
  };

  const handleScroll = (e: Event) => {
    // Don't close if scrolling inside the emoji picker itself
    if (emojiPickerRef.current && emojiPickerRef.current.contains(e.target as Node)) {
      return;
    }
    setShowEmojiPicker(false);
  };

  if (showEmojiPicker) {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', handleScroll, true); // Use capture phase
  }

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
    document.removeEventListener('keydown', handleEscape);
    window.removeEventListener('scroll', handleScroll, true);
  };
}, [showEmojiPicker]);

  // Toggle candidate selection for election
  const toggleCandidateSelection = (candidateId: string) => {
    setNewElection(prev => ({
      ...prev,
      candidates: prev.candidates.includes(candidateId)
        ? prev.candidates.filter(id => id !== candidateId)
        : [...prev.candidates, candidateId]
    }));
  };

  // Select all candidates for election
  const selectAllCandidates = () => {
    setNewElection(prev => ({
      ...prev,
      candidates: candidates.map(c => c.id)
    }));
  };

  // Clear all candidate selections
  const clearAllCandidates = () => {
    setNewElection(prev => ({
      ...prev,
      candidates: []
    }));
  };

  // Create a new election
  const handleCreateElection = async () => {
    // Prevent multiple submissions
    if (electionLoading) {
      console.log('Election creation already in progress, ignoring duplicate request');
      return;
    }

    if (!newElection.title || !newElection.description || !newElection.startDate || !newElection.endDate) {
      toast({
        title: 'Validation Error',
        description: 'All fields are required',
        variant: 'destructive',
      });
      return;
    }

    if (newElection.candidates.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one candidate for the election',
        variant: 'destructive',
      });
      return;
    }

    console.log('Creating election with data:', newElection);
    setElectionLoading(true);
    
    try {
      const response = await AdminElectionsService.createElection(newElection);

      if (response.success && response.election) {
        console.log('Election created successfully:', response.election);
        setElections(prev => [response.election!, ...prev]);
        setNewElection({ title: '', description: '', startDate: '', endDate: '', candidates: [] });
        toast({
          title: 'Success!',
          description: `Election created successfully with ${newElection.candidates.length} candidate(s)`,
          className: 'bg-green-500/10 border-green-500/50',
        });
      } else {
        console.error('Election creation failed:', response.error);
        toast({
          title: 'Error',
          description: response.error || 'Failed to create election',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error creating election:', error);
      toast({
        title: 'Error',
        description: 'Failed to create election',
        variant: 'destructive',
      });
    } finally {
      setElectionLoading(false);
    }
  };

  // Get election timing info
  const getElectionTiming = (election: AdminElection) => {
    const now = new Date(); // Use current time instead of state to ensure accuracy
    const startDate = election.startDate instanceof Date ? election.startDate : new Date(election.startDate);
    const endDate = election.endDate instanceof Date ? election.endDate : new Date(election.endDate);
    
    // Ensure dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error('Invalid dates for election:', election.title, {
        startDate: election.startDate,
        endDate: election.endDate
      });
      return {
        startDate,
        endDate,
        timeUntilStart: 0,
        timeUntilEnd: 0,
        canStart: election.status === 'upcoming',
        canEnd: election.status === 'active',
        canDeploy: election.status === 'ended',
        shouldAutoStart: false,
        shouldAutoEnd: false,
        isActive: false,
        isEnded: false
      };
    }
    
    const timeUntilStart = startDate.getTime() - now.getTime();
    const timeUntilEnd = endDate.getTime() - now.getTime();
    
    const timing = {
      startDate,
      endDate,
      timeUntilStart,
      timeUntilEnd,
      // Manual controls - can start/end anytime based on status only
      canStart: election.status === 'upcoming',
      canEnd: election.status === 'active',
      canDeploy: election.status === 'ended',
      // Timing checks for auto-start/end and display
      shouldAutoStart: election.status === 'upcoming' && now >= startDate,
      shouldAutoEnd: election.status === 'active' && now >= endDate,
      isActive: now >= startDate && now < endDate,
      isEnded: now >= endDate
    };

    // Debug logging for timing calculations
    console.log(`⏰ Timing for ${election.title}:`, {
      status: election.status,
      now: now.toISOString(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      timeUntilStart: timeUntilStart,
      timeUntilEnd: timeUntilEnd,
      shouldAutoStart: timing.shouldAutoStart,
      shouldAutoEnd: timing.shouldAutoEnd,
      canStart: timing.canStart,
      canEnd: timing.canEnd,
      timeDiff: now.getTime() - startDate.getTime() // Show actual time difference
    });

    return timing;
  };

  // Format time remaining
  const formatTimeRemaining = (milliseconds: number) => {
    if (milliseconds <= 0) return 'Time has passed';
    
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  // Handle election status updates (activate, close, deploy, delete)
  const handleElectionAction = async (electionId: string, action: 'activate' | 'close' | 'deploy' | 'delete') => {
    const election = elections.find(e => e.id === electionId);
    if (!election) return;

    const timing = getElectionTiming(election);
    
    // Check status-based restrictions (not timing-based)
    if (action === 'activate') {
      if (!timing.canStart) {
        toast({
          title: 'Cannot Start Election',
          description: 'Election must be in "upcoming" status to start',
          variant: 'destructive',
        });
        return;
      }
    } else if (action === 'close') {
      if (!timing.canEnd) {
        toast({
          title: 'Cannot Close Election',
          description: 'Election must be "active" to close',
          variant: 'destructive',
        });
        return;
      }
    } else if (action === 'deploy') {
      if (!timing.canDeploy) {
        toast({
          title: 'Cannot Deploy Results',
          description: 'Results can only be deployed after election ends',
          variant: 'destructive',
        });
        return;
      }
    } else if (action === 'delete') {
      if (election.status !== 'upcoming') {
        toast({
          title: 'Cannot Delete Election',
          description: `Cannot delete election. Election is currently ${election.status}. Only upcoming elections can be deleted.`,
          variant: 'destructive',
        });
        return;
      }
    }

    setActionLoading(prev => ({ ...prev, [electionId]: action }));
    
    try {
      if (action === 'activate') {
        console.log('🚀 Activating election:', electionId);
        console.log('Current election status:', election.status);
        const response = await AdminElectionsService.updateElectionStatus(electionId, 'active');
        console.log('Activate election response:', response);
        if (response.success) {
          console.log('✅ Election activated successfully, reloading...');
          await loadElections();
          toast({
            title: 'Success!',
            description: 'Election activated successfully',
            className: 'bg-green-500/10 border-green-500/50',
          });
        } else {
          console.error('❌ Failed to activate election:', response.error);
          toast({
            title: 'Error',
            description: response.error || 'Failed to activate election',
            variant: 'destructive',
          });
        }
      } else if (action === 'close') {
        console.log('🔴 Closing election:', electionId);
        console.log('Current election status:', election.status);
        const response = await AdminElectionsService.updateElectionStatus(electionId, 'ended');
        console.log('Close election response:', response);
        if (response.success) {
          console.log('✅ Election closed successfully, reloading...');
          await loadElections();
          toast({
            title: 'Success!',
            description: 'Election closed successfully',
            className: 'bg-green-500/10 border-green-500/50',
          });
        } else {
          console.error('❌ Failed to close election:', response.error);
          toast({
            title: 'Error',
            description: response.error || 'Failed to close election',
            variant: 'destructive',
          });
        }
      } else if (action === 'deploy') {
        console.log('Deploying results for election:', electionId);
        const response = await AdminElectionsService.deployResults(electionId);
        if (response.success) {
          await loadElections();
          toast({
            title: 'Success!',
            description: 'Results deployed successfully',
            className: 'bg-green-500/10 border-green-500/50',
          });
        } else {
          toast({
            title: 'Error',
            description: response.error || 'Failed to deploy results',
            variant: 'destructive',
          });
        }
      } else if (action === 'delete') {
        console.log('Deleting election:', electionId);
        if (window.confirm('Are you sure you want to delete this election? This action cannot be undone.')) {
          const response = await AdminElectionsService.deleteElection(electionId);
          if (response.success) {
            await loadElections();
            toast({
              title: 'Success!',
              description: 'Election deleted successfully',
              className: 'bg-green-500/10 border-green-500/50',
            });
          } else {
            toast({
              title: 'Error',
              description: response.error || 'Failed to delete election',
              variant: 'destructive',
            });
          }
        }
      }
    } catch (error: any) {
      console.error('Error performing election action:', error);
      toast({
        title: 'Error',
        description: 'Operation failed',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [electionId]: null }));
    }
  };

  // Handle edit election
  const handleEditElection = (election: AdminElection) => {
    // Check if election can be edited
    if (election.status !== 'upcoming') {
      toast({
        title: 'Cannot Edit Election',
        description: `Cannot edit election. Election is currently ${election.status}. Only upcoming elections can be edited.`,
        variant: 'destructive',
      });
      return;
    }

    setEditingElection(election);
    setNewElection({
      title: election.title,
      description: election.description,
      startDate: election.startDate instanceof Date 
        ? election.startDate.toISOString().slice(0, 16)
        : new Date(election.startDate).toISOString().slice(0, 16),
      endDate: election.endDate instanceof Date 
        ? election.endDate.toISOString().slice(0, 16)
        : new Date(election.endDate).toISOString().slice(0, 16),
      candidates: election.candidates || []
    });
    
    // Auto-scroll to the form
    setTimeout(() => {
      const formElement = document.querySelector('[data-election-form]');
      if (formElement) {
        formElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 100);
  };

  // Handle update election
  const handleUpdateElection = async () => {
    if (!editingElection || !newElection.title || !newElection.description || !newElection.startDate || !newElection.endDate) {
      toast({
        title: 'Validation Error',
        description: 'All fields are required',
        variant: 'destructive',
      });
      return;
    }

    if (newElection.candidates.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one candidate for the election',
        variant: 'destructive',
      });
      return;
    }

    setUpdateElectionLoading(true);
    
    try {
      const response = await AdminElectionsService.updateElection(editingElection.id!, newElection);

      if (response.success && response.election) {
        await loadElections();
        setEditingElection(null);
        setNewElection({ title: '', description: '', startDate: '', endDate: '', candidates: [] });
        toast({
          title: 'Success!',
          description: 'Election updated successfully',
          className: 'bg-green-500/10 border-green-500/50',
        });
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to update election',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error updating election:', error);
      toast({
        title: 'Error',
        description: 'Failed to update election',
        variant: 'destructive',
      });
    } finally {
      setUpdateElectionLoading(false);
    }
  };

  const handleAddCandidate = async () => {
    if (!newCandidate.name || !newCandidate.party || !newCandidate.symbol) {
      toast({
        title: 'Validation Error',
        description: 'Name, party, and symbol are required',
        variant: 'destructive',
      });
      return;
    }
    
    setCandidateLoading(true);
    
    try {
      // Debug: Check if user is authenticated
      const token = localStorage.getItem('idToken');
      const userData = localStorage.getItem('user');
      
      console.log('Token exists:', !!token);
      console.log('User data exists:', !!userData);
      console.log('User is admin:', userData ? JSON.parse(userData).isAdmin : false);
      
      if (!token) {
        toast({
          title: 'Authentication Error',
          description: 'Please sign in again',
          variant: 'destructive',
        });
        router.push('/signin');
        return;
      }
      
      const response = await AdminCandidatesService.createCandidate(newCandidate);
      
      if (response.success && response.candidate) {
        setCandidates(prev => [...prev, response.candidate!]);
        setNewCandidate({ name: '', party: '', symbol: '', description: '' });
        toast({
          title: 'Success!',
          description: 'Candidate created successfully',
          className: 'bg-green-500/10 border-green-500/50',
        });
      } else {
        console.error('API Error Response:', response);
        toast({
          title: 'Error',
          description: response.error || 'Failed to create candidate',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error creating candidate:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create candidate',
        variant: 'destructive',
      });
    } finally {
      setCandidateLoading(false);
    }
  };

  const handleDeleteCandidate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return;
    }
    
    setCandidateLoading(true);
    
    try {
      const response = await AdminCandidatesService.deleteCandidate(id);
      
      if (response.success) {
        setCandidates(prev => prev.filter(c => c.id !== id));
        toast({
          title: 'Success!',
          description: 'Candidate deleted successfully',
          className: 'bg-green-500/10 border-green-500/50',
        });
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to delete candidate',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error deleting candidate:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete candidate',
        variant: 'destructive',
      });
    } finally {
      setCandidateLoading(false);
    }
  };

  const handleEditCandidate = (candidate: AdminCandidate) => {
    setEditingCandidate(candidate);
    setNewCandidate({
      name: candidate.name,
      party: candidate.party,
      symbol: candidate.symbol,
      description: candidate.description || ''
    });
  };

  const handleUpdateCandidate = async () => {
    if (!editingCandidate) return;
    
    if (!newCandidate.name || !newCandidate.party || !newCandidate.symbol) {
      toast({
        title: 'Validation Error',
        description: 'Name, party, and symbol are required',
        variant: 'destructive',
      });
      return;
    }
    
    setCandidateLoading(true);
    
    try {
      const response = await AdminCandidatesService.updateCandidate(editingCandidate.id, newCandidate);
      
      if (response.success && response.candidate) {
        setCandidates(prev => prev.map(c => c.id === editingCandidate.id ? response.candidate! : c));
        setEditingCandidate(null);
        setNewCandidate({ name: '', party: '', symbol: '', description: '' });
        toast({
          title: 'Success!',
          description: 'Candidate updated successfully',
          className: 'bg-green-500/10 border-green-500/50',
        });
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to update candidate',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error updating candidate:', error);
      toast({
        title: 'Error',
        description: 'Failed to update candidate',
        variant: 'destructive',
      });
    } finally {
      setCandidateLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingCandidate(null);
    setNewCandidate({ name: '', party: '', symbol: '', description: '' });
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emojiData: any) => {
    // Handle both old and new emoji-picker-react API
    const emoji = emojiData.emoji || emojiData.native || emojiData;
    setNewCandidate(prev => ({ ...prev, symbol: emoji }));
    setShowEmojiPicker(false);
  };

  // Load blockchain statistics
  const loadBlockchainStats = async () => {
    try {
      const token = localStorage.getItem('idToken');
      if (!token) return;

      const response = await fetch('/api/admin/blockchain/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setBlockchainStats(data.data);
      }
    } catch (error) {
      console.error('Error loading blockchain stats:', error);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blockchain-primary"></div>
        </div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navigation />
      
      <div className="relative min-h-[calc(100vh-4rem)]">
        <ThreeBackground />
        
        <div className="relative max-w-7xl mx-auto p-4 py-8">
          {/* Header */}
          <div ref={headerRef} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6 shadow-lg">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
              Admin Control Center
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Manage elections, candidates, and system settings with advanced controls
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-10">
            <div className="flex space-x-1 bg-white/80 backdrop-blur-sm p-1 rounded-xl max-w-lg mx-auto shadow-lg border border-gray-200/50">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3, color: 'from-blue-500 to-blue-600' },
                { id: 'election', label: 'Election', icon: Play, color: 'from-green-500 to-green-600' },
                { id: 'candidates', label: 'Candidates', icon: Users, color: 'from-purple-500 to-purple-600' }
              ].map(({ id, label, icon: Icon, color }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors duration-300 flex-1 justify-center relative ${
                    activeTab === id
                      ? `bg-gradient-to-r ${color} text-white shadow-lg`
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Header with Refresh */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Overview Statistics</h2>
                <Button
                  onClick={handleRefreshAll}
                  variant="outline"
                  size="sm"
                  disabled={statsLoading || refreshLoading}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className={`h-4 w-4 ${(statsLoading || refreshLoading) ? 'animate-spin' : ''}`} />
                  <span>{(statsLoading || refreshLoading) ? 'Refreshing...' : 'Refresh Stats'}</span>
                </Button>
              </div>

              {/* Stats Cards */}
              <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Registered Voters</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                          {adminStats?.overview.totalUsers.toLocaleString() || electionStats.totalVoters.toLocaleString()}
                        </p>
                        <div className="flex items-center mt-2">
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-xs text-green-600">
                            {adminStats?.overview.userGrowthPercentage 
                              ? `+${adminStats.overview.userGrowthPercentage}% this month` 
                              : 'Loading...'}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                        <Users className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Total Votes Cast</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                          {adminStats?.activeElection.totalVotes.toLocaleString() || electionStats.totalVotes.toLocaleString()}
                        </p>
                        <div className="flex items-center mt-2">
                          <Activity className="h-4 w-4 text-blue-500 mr-1" />
                          <span className="text-xs text-blue-600">
                            {adminStats?.activeElection.status === 'active' ? 'Live tracking' : 'Election ended'}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                        <Eye className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Turnout Rate</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                          {adminStats?.activeElection.turnoutPercentage || electionStats.turnoutPercentage}%
                        </p>
                        <div className="flex items-center mt-2">
                          <Target className="h-4 w-4 text-orange-500 mr-1" />
                          <span className="text-xs text-orange-600">
                            {adminStats?.activeElection.turnoutPercentage && adminStats.activeElection.turnoutPercentage > 50 
                              ? 'Above average' 
                              : adminStats?.activeElection.turnoutPercentage
                              ? 'Below average'
                              : 'Loading...'}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
                        <BarChart3 className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Election Status</p>
                        <div className="flex items-center space-x-2">
                          <Badge className={`${
                            electionStats.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
                            electionStats.status === 'ended' ? 'bg-blue-100 text-blue-800 border-blue-200' : 
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {electionStats.status === 'active' ? 'Active' :
                             electionStats.status === 'ended' ? 'Ended' : 'Upcoming'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {electionStats.status === 'active' ? 'Voting in progress' :
                           electionStats.status === 'ended' ? 'Results available' : 'Not started'}
                        </p>
                        {adminStats?.activeElection.electionTitle && (
                          <p className="text-xs font-semibold text-gray-700 mt-1">
                            {adminStats.activeElection.electionTitle}
                          </p>
                        )}
                      </div>
                      <div className={`p-3 rounded-xl ${
                        electionStats.status === 'active' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                        electionStats.status === 'ended' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 
                        'bg-gradient-to-r from-gray-500 to-gray-600'
                      }`}>
                        {electionStats.status === 'active' ? 
                          <CheckCircle className="h-8 w-8 text-white" /> :
                          <Clock className="h-8 w-8 text-white" />
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Total Elections</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {adminStats?.overview.totalElections || 0}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">All time</p>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Total Candidates</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {adminStats?.overview.totalCandidates || candidates.length}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Registered</p>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl">
                        <UserPlus className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">New Users</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {adminStats?.overview.newUsersThisMonth || 0}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">This month</p>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Status */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-green-800">Blockchain Network</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-green-600">
                          {adminStats?.system.blockchainStatus || 'Online'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-green-800">Database</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-green-600">
                          {adminStats?.system.databaseStatus || 'Connected'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-green-800">System Uptime</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-green-600">
                          {adminStats?.system.uptimePercentage || 99.9}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Election Management Tab */}
          {activeTab === 'election' && (
            <div className="space-y-6">
               {/* Create New Election */}
               <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm" data-election-form>
                 <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <span>{editingElection ? 'Edit Election' : 'Create New Election'}</span>
                    {editingElection && (
                      <Button
                        onClick={() => {
                          setEditingElection(null);
                          setNewElection({ title: '', description: '', startDate: '', endDate: '', candidates: [] });
                        }}
                        size="sm"
                        variant="outline"
                        className="ml-auto"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Election Title</label>
                      <Input
                        placeholder="e.g., National Elections 2025"
                        value={newElection.title}
                        onChange={(e) => setNewElection(prev => ({ ...prev, title: e.target.value }))}
                        disabled={electionLoading}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      <Input
                        placeholder="Brief description"
                        value={newElection.description}
                        onChange={(e) => setNewElection(prev => ({ ...prev, description: e.target.value }))}
                        disabled={electionLoading}
                        className="h-12"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Start Date & Time</label>
                      <Input
                        type="datetime-local"
                        value={newElection.startDate as string}
                        onChange={(e) => setNewElection(prev => ({ ...prev, startDate: e.target.value }))}
                        disabled={electionLoading}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">End Date & Time</label>
                      <Input
                        type="datetime-local"
                        value={newElection.endDate as string}
                        onChange={(e) => setNewElection(prev => ({ ...prev, endDate: e.target.value }))}
                        disabled={electionLoading}
                        className="h-12"
                      />
                    </div>
                  </div>

                  {/* Candidate Selection Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        Select Candidates for Nomination
                      </label>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          onClick={selectAllCandidates}
                          size="sm"
                          variant="outline"
                          disabled={electionLoading || candidates.length === 0}
                          className="text-xs"
                        >
                          Select All
                        </Button>
                        <Button
                          type="button"
                          onClick={clearAllCandidates}
                          size="sm"
                          variant="outline"
                          disabled={electionLoading || newElection.candidates.length === 0}
                          className="text-xs"
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>

                    {candidates.length === 0 ? (
                      <div className="flex items-center space-x-2 p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        <span className="text-sm text-orange-800">
                          No candidates available. Please add candidates first in the Candidates tab.
                    </span>
                  </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg border border-gray-200">
                        {candidates.map((candidate) => (
                          <div
                            key={candidate.id}
                            onClick={() => toggleCandidateSelection(candidate.id)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                              newElection.candidates.includes(candidate.id)
                                ? 'bg-green-50 border-green-500 shadow-md'
                                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center ${
                                newElection.candidates.includes(candidate.id)
                                  ? 'bg-green-500 border-green-500'
                                  : 'bg-white border-gray-300'
                              }`}>
                                {newElection.candidates.includes(candidate.id) && (
                                  <CheckCircle className="h-5 w-5 text-white" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="text-2xl">{candidate.symbol}</span>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                      {candidate.name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                      {candidate.party}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Selected Candidates Count */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          {newElection.candidates.length} candidate(s) selected
                        </span>
                      </div>
                      {newElection.candidates.length > 0 && (
                        <Badge className="bg-blue-600 text-white">
                          Ready to create
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                  <Button
                      onClick={editingElection ? handleUpdateElection : handleCreateElection}
                      disabled={electionLoading || updateElectionLoading || candidates.length === 0}
                    className="h-12 px-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  >
                      {(electionLoading || updateElectionLoading) ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-5 w-5 mr-2" />
                    )}
                      {editingElection ? 'Update Election' : 'Create Election'}
                  </Button>
                    
                    {editingElection && (
                      <Button
                        onClick={() => {
                          setEditingElection(null);
                          setNewElection({ title: '', description: '', startDate: '', endDate: '', candidates: [] });
                        }}
                        variant="outline"
                        className="h-12 px-6"
                      >
                        <X className="h-5 w-5 mr-2" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Elections List */}
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <span>All Elections</span>
                      <Badge variant="secondary" className="ml-3 bg-blue-100 text-blue-800">
                        {elections.length}
                      </Badge>
                    </CardTitle>
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleRefreshAll}
                        variant="outline"
                        size="sm"
                        disabled={refreshLoading}
                        className="flex items-center space-x-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${refreshLoading ? 'animate-spin' : ''}`} />
                        <span>{refreshLoading ? 'Refreshing...' : 'Refresh All'}</span>
                      </Button>
                      <Button
                        onClick={handleRefreshStats}
                        variant="outline"
                        size="sm"
                        disabled={refreshLoading}
                        className="flex items-center space-x-2 text-green-600 border-green-300 hover:bg-green-50"
                      >
                        <Target className={`h-4 w-4 ${refreshLoading ? 'animate-spin' : ''}`} />
                        <span>Refresh Stats</span>
                      </Button>
                      <Button
                        onClick={handleForceCloseAll}
                        variant="outline"
                        size="sm"
                        disabled={refreshLoading}
                        className="flex items-center space-x-2 text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Square className={`h-4 w-4 ${refreshLoading ? 'animate-spin' : ''}`} />
                        <span>Force Close All</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {elections.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                          <Calendar className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Elections Yet</h3>
                        <p className="text-gray-500 mb-4">Create your first election to get started.</p>
                      </div>
                     ) : (
                       elections.map((election) => {
                         const timing = getElectionTiming(election);
                         return (
                         <div key={election.id} className="p-6 bg-gradient-to-r from-white to-gray-50/50 rounded-xl border border-gray-200/50 hover:shadow-md hover:border-gray-300 transition-all duration-200">
                           <div className="flex items-start justify-between mb-4">
                             <div className="flex-1">
                               <div className="flex items-center space-x-3 mb-2">
                                 <h3 className="text-xl font-bold text-gray-900">{election.title}</h3>
                                 <Badge className={`${
                                   election.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
                                   election.status === 'ended' ? 'bg-blue-100 text-blue-800 border-blue-200' : 
                                   'bg-gray-100 text-gray-800 border-gray-200'
                                 }`}>
                                   {election.status.charAt(0).toUpperCase() + election.status.slice(1)}
                                 </Badge>
                                 
                                 {/* Live Timer Badges */}
                                 {election.status === 'upcoming' && timing.timeUntilStart > 0 && (
                                   <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                     Starts in {formatTimeRemaining(timing.timeUntilStart)}
                                   </Badge>
                                 )}
                                 {election.status === 'upcoming' && timing.shouldAutoStart && (
                                   <Badge className="bg-green-100 text-green-800 border-green-200 animate-pulse">
                                     🚀 Auto-starting now
                                   </Badge>
                                 )}
                                 {election.status === 'active' && timing.timeUntilEnd > 0 && (
                                   <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                                     Ends in {formatTimeRemaining(timing.timeUntilEnd)}
                                   </Badge>
                                 )}
                                 {election.status === 'active' && timing.shouldAutoEnd && (
                                   <Badge className="bg-red-100 text-red-800 border-red-200 animate-pulse">
                                     ⏰ Auto-ending now
                                   </Badge>
                                 )}
                                 {election.status === 'active' && timing.timeUntilEnd <= 0 && (
                                   <Badge className="bg-red-100 text-red-800 border-red-200">
                                     Time Expired
                                   </Badge>
                                 )}
                               </div>
                              <p className="text-gray-600 mb-3">{election.description}</p>
                              
                              {/* Nominated Candidates */}
                              {election.candidates && election.candidates.length > 0 && (
                                <div className="mb-4">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Users className="h-4 w-4 text-purple-600" />
                                    <span className="text-xs font-semibold text-purple-800 uppercase">
                                      Nominated Candidates ({election.candidates.length})
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {election.candidates.map((candidateId) => {
                                      const candidate = candidates.find(c => c.id === candidateId);
                                      if (!candidate) return null;
                                      return (
                                        <div
                                          key={candidateId}
                                          className="inline-flex items-center space-x-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg"
                                        >
                                          <span className="text-lg">{candidate.symbol}</span>
                                          <span className="text-xs font-medium text-purple-900">
                                            {candidate.name}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-4 w-4 text-gray-500" />
                                  <div>
                                    <p className="text-xs text-gray-500">Start Date</p>
                                    <p className="text-sm font-medium text-gray-900">
                                      {new Date(election.startDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4 text-gray-500" />
                                  <div>
                                    <p className="text-xs text-gray-500">End Date</p>
                                    <p className="text-sm font-medium text-gray-900">
                                      {new Date(election.endDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Eye className="h-4 w-4 text-gray-500" />
                                  <div>
                                    <p className="text-xs text-gray-500">Total Votes</p>
                                    <p className="text-sm font-medium text-gray-900">
                                      {election.totalVotes || 0}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Activity className="h-4 w-4 text-gray-500" />
                                  <div>
                                    <p className="text-xs text-gray-500">Turnout</p>
                                    <p className="text-sm font-medium text-gray-900">
                                      {election.turnoutPercentage || 0}%
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                           <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                             {/* Debug info */}
                             {process.env.NODE_ENV === 'development' && (
                               <div className="text-xs text-gray-500 mb-2 w-full">
                                 Debug: Status={election.status}, canStart={timing.canStart ? 'true' : 'false'}, canEnd={timing.canEnd ? 'true' : 'false'}, shouldAutoStart={timing.shouldAutoStart ? 'true' : 'false'}
                                 <br />
                                 Start: {timing.startDate.toISOString()}, Now: {new Date().toISOString()}, Diff: {new Date().getTime() - timing.startDate.getTime()}ms
                                 <br />
                                 <Button
                                   onClick={() => checkElectionTiming()}
                                   size="sm"
                                   variant="outline"
                                   className="mt-1 text-xs"
                                 >
                                   🔄 Test Auto-Start Check
                                 </Button>
                               </div>
                             )}
                             
                             <Button
                               onClick={() => handleElectionAction(election.id!, 'activate')}
                               disabled={!timing.canStart || !!actionLoading[election.id!]}
                               size="sm"
                               className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all duration-200"
                             >
                               {actionLoading[election.id!] === 'activate' ? (
                                 <Loader2 className="h-4 w-4 animate-spin mr-1" />
                               ) : (
                                 <Play className="h-4 w-4 mr-1" />
                               )}
                               Start
                             </Button>
                             
                             <Button
                               onClick={() => handleElectionAction(election.id!, 'close')}
                               disabled={!timing.canEnd || !!actionLoading[election.id!]}
                               size="sm"
                               variant="secondary"
                               className="transition-all duration-200"
                             >
                               {actionLoading[election.id!] === 'close' ? (
                                 <Loader2 className="h-4 w-4 animate-spin mr-1" />
                               ) : (
                                 <Square className="h-4 w-4 mr-1" />
                               )}
                               Close
                             </Button>
                             
                             {/* Only show deploy button for ended elections */}
                             {election.status === 'ended' && (
                               <Button
                                 onClick={() => handleElectionAction(election.id!, 'deploy')}
                                 disabled={!!actionLoading[election.id!]}
                                 size="sm"
                                 variant="outline"
                                 className="border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600 transition-all duration-200"
                               >
                                 {actionLoading[election.id!] === 'deploy' ? (
                                   <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                 ) : (
                                   <Upload className="h-4 w-4 mr-1" />
                                 )}
                                 Deploy Results
                               </Button>
                             )}

                             {/* Only show edit/delete buttons for upcoming elections */}
                             {election.status === 'upcoming' && (
                               <>
                                 <Button
                                   onClick={() => handleEditElection(election)}
                                   disabled={!!actionLoading[election.id!]}
                                   size="sm"
                                   variant="outline"
                                   className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600 transition-all duration-200"
                                 >
                                   <Edit className="h-4 w-4 mr-1" />
                                   Edit
                                 </Button>

                                 <Button
                                   onClick={() => handleElectionAction(election.id!, 'delete')}
                                   disabled={!!actionLoading[election.id!]}
                                   size="sm"
                                   variant="destructive"
                                   className="bg-red-600 hover:bg-red-700 transition-all duration-200"
                                 >
                                   {actionLoading[election.id!] === 'delete' ? (
                                     <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                   ) : (
                                     <Trash2 className="h-4 w-4 mr-1" />
                                   )}
                                   Delete
                                 </Button>
                               </>
                             )}

                             {/* Show status message for active/ended elections */}
                             {(election.status === 'active' || election.status === 'ended') && (
                               <div className="flex items-center space-x-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
                                 <AlertCircle className="h-4 w-4" />
                                 <span className="font-medium">
                                   {election.status === 'active' 
                                     ? 'Election is active - editing disabled' 
                                     : 'Election has ended - editing disabled'
                                   }
                                 </span>
                               </div>
                             )}
                           </div>
                        </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Candidates Management Tab */}
          {activeTab === 'candidates' && (
            <div ref={candidatesRef} className="space-y-8 relative">
              {/* Add New Candidate */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                      <UserPlus className="h-5 w-5 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      {editingCandidate ? 'Edit Candidate' : 'Add New Candidate'}
                    </span>
                  </CardTitle>
                  <p className="text-gray-600 mt-2">
                    {editingCandidate ? 'Update candidate information and party details' : 'Register a new candidate for the election'}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6 pb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Candidate Name</label>
                      <Input
                        placeholder="Enter full candidate name"
                        value={newCandidate.name}
                        onChange={(e) => setNewCandidate(prev => ({ ...prev, name: e.target.value }))}
                        disabled={candidateLoading}
                        className="h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Political Party</label>
                      <Input
                        placeholder="Enter party name"
                        value={newCandidate.party}
                        onChange={(e) => setNewCandidate(prev => ({ ...prev, party: e.target.value }))}
                        disabled={candidateLoading}
                        className="h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700">Party Symbol</label>
                        {newCandidate.symbol && (
                          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg border border-purple-200">
                            <span className="text-lg">{newCandidate.symbol}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">Choose a symbol to represent the political party (e.g., 🌟, 🏛️, ⚡)</p>
                      <div className="flex space-x-2">
                        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 bg-gray-50/30 h-12 transition-colors hover:border-purple-300 hover:bg-purple-50/30">
                          {newCandidate.symbol ? (
                            <span className="text-2xl">{newCandidate.symbol}</span>
                          ) : (
                            <span className="text-gray-400 text-sm font-medium">Click button to select symbol</span>
                          )}
                        </div>
                        <Button
                          ref={emojiButtonRef}
                          type="button"
                          onClick={() => {
                            if (emojiButtonRef.current) {
                              const rect = emojiButtonRef.current.getBoundingClientRect();
                              setEmojiPickerPosition({
                                top: rect.bottom + 8,
                                left: rect.left
                              });
                            }
                            setShowEmojiPicker(!showEmojiPicker);
                          }}
                          variant="outline"
                          disabled={candidateLoading}
                          className="flex items-center justify-center min-w-[48px] h-12 border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-colors"
                        >
                          <Hash className="h-4 w-4" />
                        </Button>
                        {newCandidate.symbol && (
                          <Button
                            type="button"
                            onClick={() => setNewCandidate(prev => ({ ...prev, symbol: '' }))}
                            variant="outline"
                            disabled={candidateLoading}
                            className="flex items-center justify-center min-w-[48px] h-12 text-red-500 hover:bg-red-50 hover:border-red-300 border-red-200 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      {showEmojiPicker && typeof window !== 'undefined' && createPortal(
                        <>
                          {/* Backdrop */}
                          <div 
                            className="fixed inset-0 z-[999998] bg-black/10"
                            onClick={() => setShowEmojiPicker(false)}
                          />
                          {/* Emoji Picker */}
                          <div 
                            ref={emojiPickerRef}
                            className="fixed z-[999999] shadow-2xl rounded-lg overflow-hidden border border-gray-200 bg-white max-h-[400px] overflow-y-auto"
                            style={{
                              top: Math.min(emojiPickerPosition.top, window.innerHeight - 450),
                              left: Math.min(emojiPickerPosition.left, window.innerWidth - 350),
                              maxWidth: '350px',
                            }}
                          >
                            <EmojiPicker 
                              onEmojiClick={handleEmojiClick}
                              width="100%"
                              height={400}
                            />
                          </div>
                        </>,
                        document.body
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Description (Optional)</label>
                      <Input
                        placeholder="Brief description about the candidate"
                        value={newCandidate.description}
                        onChange={(e) => setNewCandidate(prev => ({ ...prev, description: e.target.value }))}
                        disabled={candidateLoading}
                        className="h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <Button 
                      onClick={editingCandidate ? handleUpdateCandidate : handleAddCandidate}
                      disabled={candidateLoading}
                      className="flex items-center space-x-2 h-12 px-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {candidateLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Plus className="h-5 w-5" />
                      )}
                      <span className="font-medium">{editingCandidate ? 'Update Candidate' : 'Add Candidate'}</span>
                    </Button>
                    
                    {editingCandidate && (
                      <Button 
                        onClick={cancelEdit}
                        variant="outline"
                        disabled={candidateLoading}
                        className="h-12 px-6 border-gray-300 hover:border-red-300 hover:text-red-600 hover:bg-red-50"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Candidates List */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                          Registered Candidates
                        </span>
                        <Badge variant="secondary" className="ml-3 bg-blue-100 text-blue-800">
                          {candidates.length}
                        </Badge>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {candidateLoading && candidates.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Loading candidates...</span>
                      </div>
                    ) : (
                      candidates.map((candidate, index) => (
                         <div key={candidate.id} className="flex items-center justify-between p-6 bg-gradient-to-r from-white to-gray-50/50 rounded-xl border border-gray-200/50 hover:shadow-md hover:border-purple-300 transition-all duration-200">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-white to-gray-100 rounded-xl border-2 border-gray-200 shadow-sm">
                              <span className="text-3xl">{candidate.symbol}</span>
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-lg">{candidate.name}</h4>
                              <p className="text-sm text-gray-600 font-medium">{candidate.party}</p>
                              {candidate.description && (
                                <p className="text-xs text-gray-500 mt-1 max-w-md">{candidate.description}</p>
                              )}
                              <div className="flex items-center mt-2">
                                <Badge variant="outline" className="text-xs">
                                  Candidate #{index + 1}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handleEditCandidate(candidate)}
                              variant="outline"
                              size="sm"
                              disabled={candidateLoading}
                               className="h-10 w-10 p-0 text-blue-500 hover:bg-blue-100 hover:border-blue-300 border-blue-200 transition-all duration-200"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteCandidate(candidate.id, candidate.name)}
                              variant="outline"
                              size="sm"
                              disabled={candidateLoading}
                               className="h-10 w-10 p-0 text-red-500 hover:bg-red-100 hover:border-red-300 border-red-200 transition-all duration-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                    
                    {candidates.length === 0 && !candidateLoading && (
                      <div className="text-center py-16">
                        <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                          <Users className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Candidates Yet</h3>
                        <p className="text-gray-500 mb-4">Start building your election by adding candidates above.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}