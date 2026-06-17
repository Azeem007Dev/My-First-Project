'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import ThreeBackground from '@/components/ThreeBackground';
import { gsap } from 'gsap';
import { Vote, Check, AlertCircle, Clock, CheckCircle, Zap, Sparkles, Eye, Hash, ShieldCheck } from 'lucide-react';

interface Candidate {
  id?: string;
  name: string;
  party: string;
  symbol: string;
  color: string;
}

interface User {
  uid: string;
  name: string;
  cnic: string;
  isAdmin: boolean;
}

interface Election {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'ended';
  candidates: string[];
  hasVoted: boolean;
  userVote?: {
    id: string;
    candidateId: string;
    timestamp: Date;
    transactionHash: string;
  } | null;
}

export default function CastVote() {
  const [user, setUser] = useState<User | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [activeElections, setActiveElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [votedElections, setVotedElections] = useState<{[electionId: string]: string}>({});
  const router = useRouter();
  const candidatesRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadVotingData = async () => {
      try {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('idToken');
        
        if (!userData || !token) {
          router.push('/signin');
          return;
        }
        
        setUser(JSON.parse(userData));
        
        // Get all active elections from API
        console.log('Fetching active elections with token:', token ? 'Present' : 'Missing');
        const response = await fetch('/api/vote/elections/active', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        console.log('Active elections API response status:', response.status);
        
        if (response.status === 401) {
          console.error('Authentication failed');
          alert('Your session has expired. Please log in again.');
          localStorage.removeItem('idToken');
          localStorage.removeItem('user');
          router.push('/signin');
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        console.log('Active elections API response data:', data);
        
        if (data.success && data.elections) {
          console.log('Found elections:', data.elections.length);
          setActiveElections(data.elections);
          
          if (data.elections.length === 0) {
            console.log('No active elections found');
            setIsLoading(false);
            return;
          }
          
          // Select first election by default
          const firstElection = data.elections[0];
          console.log('Selected election:', firstElection);
          setSelectedElection(firstElection);
          
          // Load candidates for selected election
          await loadCandidatesForElection(firstElection.id);
          
          // Store voted elections with their hashes
          const votedMap: {[electionId: string]: string} = {};
          data.elections.forEach((election: Election) => {
            if (election.hasVoted && election.userVote) {
              votedMap[election.id] = election.userVote.transactionHash;
            }
          });
          setVotedElections(votedMap);
          
          setIsLoading(false);
        } else {
          console.error('Failed to load elections:', data.error);
          alert(`Failed to load elections: ${data.error || 'Unknown error'}`);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading voting data:', error);
        setIsLoading(false);
      }
    };

    const loadCandidatesForElection = async (electionId: string) => {
      try {
        const { DatabaseService } = await import('@/lib/database');
        const allCandidates = await DatabaseService.getCandidates();
        const election = activeElections.find(e => e.id === electionId) || selectedElection;
        
        if (election) {
          const electionCandidates = allCandidates.filter(candidate => 
            candidate.id && election.candidates.includes(candidate.id)
          );
          setCandidates(electionCandidates);
        }
      } catch (error) {
        console.error('Error loading candidates:', error);
      }
    };
    
    loadVotingData();

    // Animate header
    if (headerRef.current) {
      gsap.fromTo(headerRef.current,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power2.out" }
      );
    }
  }, [router]);

  // Function to load candidates for a specific election
  const loadCandidatesForElection = async (electionId: string) => {
    try {
      const { DatabaseService } = await import('@/lib/database');
      const allCandidates = await DatabaseService.getCandidates();
      const election = activeElections.find(e => e.id === electionId) || selectedElection;
      
      if (election) {
        const electionCandidates = allCandidates.filter(candidate => 
          candidate.id && election.candidates.includes(candidate.id)
        );
        setCandidates(electionCandidates);
        
        // Animate candidates when loaded
        setTimeout(() => {
          if (candidatesRef.current && !election.hasVoted) {
            gsap.fromTo(candidatesRef.current.children,
              { y: 50, opacity: 0, scale: 0.9 },
              { 
                y: 0, 
                opacity: 1, 
                scale: 1, 
                duration: 0.5, 
                stagger: 0.1, 
                ease: "power2.out"
              }
            );
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error loading candidates:', error);
    }
  };

  const handleVote = async () => {
    if (!selectedCandidate || !user || !selectedElection) return;
    
    setIsVoting(true);
    
    try {
      const token = localStorage.getItem('idToken');
      const userData = localStorage.getItem('user');
      
      if (!token || !userData) {
        console.error('No authentication token or user data found');
        alert('Authentication required. Please log in again.');
        router.push('/signin');
        setIsVoting(false);
        return;
      }
      
      console.log('Casting vote for election:', selectedElection.id, 'candidate:', selectedCandidate);
      
      // Cast vote using API
      const response = await fetch('/api/vote/cast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          candidateId: selectedCandidate,
          electionId: selectedElection.id,
        }),
      });
      
      console.log('Vote API response status:', response.status);
      
      if (response.status === 401) {
        console.error('Authentication failed - token expired');
        alert('Your session has expired. Please log in again.');
        localStorage.removeItem('idToken');
        localStorage.removeItem('user');
        router.push('/signin');
        setIsVoting(false);
        return;
      }
      
      const data = await response.json();
      console.log('Vote API response:', data);
      
      if (data.success) {
        // Use actual blockchain hash from vote result
        const blockHash = data.blockHash || '';
        
        // Store the hash for this election
        setVotedElections(prev => ({
          ...prev,
          [selectedElection.id]: blockHash
        }));
        
        // Update selected election to show user has voted
        setSelectedElection(prev => prev ? { ...prev, hasVoted: true } : null);
        
        // Update the active elections list to reflect the vote
        setActiveElections(prev => prev.map(election => 
          election.id === selectedElection.id 
            ? { ...election, hasVoted: true, userVote: {
                id: data.voteId || '',
                candidateId: selectedCandidate,
                timestamp: new Date(),
                transactionHash: blockHash
              }}
            : election
        ));
        
        // Success animation
        if (candidatesRef.current) {
          gsap.to(candidatesRef.current, { 
            scale: 1.05, 
            duration: 0.3,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut",
            onComplete: () => {
              gsap.to(candidatesRef.current, { scale: 1, duration: 0.2 });
            }
          });
        }
        
        alert('Vote cast successfully! Your vote has been recorded on the blockchain.');
        
        // Clear selection for next potential vote
        setSelectedCandidate('');
      } else {
        console.error('Vote failed:', data.error);
        alert(`Vote failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error casting vote:', error);
      alert('Error casting vote. Please try again.');
    }
    
    setIsVoting(false);
  };

  const handleElectionSelect = (election: Election) => {
    setSelectedElection(election);
    setSelectedCandidate('');
    loadCandidatesForElection(election.id);
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'border-blue-400/50 hover:border-blue-400 bg-blue-500/10',
      green: 'border-green-400/50 hover:border-green-400 bg-green-500/10',
      purple: 'border-purple-400/50 hover:border-purple-400 bg-purple-500/10',
      orange: 'border-orange-400/50 hover:border-orange-400 bg-orange-500/10',
    };
    return colorMap[color as keyof typeof colorMap] || 'border-gray-400/50 hover:border-gray-400 bg-gray-500/10';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-primary">
        <ThreeBackground variant="ledger" />
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blockchain-primary mx-auto mb-4"></div>
            <p className="text-gray-400">Loading voting interface...</p>
          </div>
        </div>
      </div>
    );
  }

  if (activeElections.length === 0) {
    return (
      <div className="min-h-screen bg-dark-primary">
        <ThreeBackground variant="minimal" />
        <Navigation />
        <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center glass-card border-yellow-500/30">
            <CardContent className="p-12">
              <div className="flex items-center justify-center mb-8">
                <div className="p-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full neon-glow pulse-glow">
                  <Clock className="h-16 w-16 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-6">
                No Active Elections
              </h2>
              <p className="text-gray-300 mb-8 text-lg">
                There are currently no active elections. Please check back later or contact the administrator.
              </p>
              <Button 
                onClick={() => router.push('/')} 
                variant="outline"
                className="border-blockchain-primary/30 text-blockchain-accent hover:bg-blockchain-primary/10"
              >
                Return Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const hasVotedInAllElections = activeElections.every(e => e.hasVoted);
  const votedCount = activeElections.filter(e => e.hasVoted).length;

  return (
    <div className="min-h-screen bg-dark-primary">
      <ThreeBackground variant="ledger" />
      <Navigation />
      
      <div className="relative min-h-[calc(100vh-4rem)]">
        <div className="cyber-grid absolute inset-0 opacity-10"></div>
        
        <div className="relative max-w-7xl mx-auto p-4 py-8 z-10">
          {/* Header */}
          <div ref={headerRef} className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 purple-gradient rounded-full mb-6 neon-glow pulse-glow">
              <Vote className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold gradient-text neon-text mb-4">Cast Your Vote</h1>
            <p className="text-gray-400 text-lg mb-2">
              {hasVotedInAllElections 
                ? '✅ You have voted in all active elections'
                : `You have voted in ${votedCount} of ${activeElections.length} active election${activeElections.length > 1 ? 's' : ''}`
              }
            </p>
            <p className="text-gray-500 text-sm">
              Select an election below to vote or view your vote receipt
            </p>
          </div>

          {/* Election Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {activeElections.map((election) => (
              <Card 
                key={election.id}
                className={`glass-card cursor-pointer transition-all duration-300 ${
                  selectedElection?.id === election.id
                    ? 'border-blockchain-primary border-2 neon-glow'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onClick={() => handleElectionSelect(election)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white text-xl mb-2">{election.title}</CardTitle>
                      <p className="text-gray-400 text-sm">{election.description}</p>
                    </div>
                    <Badge className={election.hasVoted 
                      ? 'bg-green-500/20 text-green-400 border-green-500/50'
                      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                    }>
                      {election.hasVoted ? '✓ Voted' : 'Not Voted'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">End Date:</span>
                      <span className="text-gray-300">{new Date(election.endDate).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Candidates:</span>
                      <span className="text-gray-300">{election.candidates.length}</span>
                    </div>
                    
                    {/* Show hash if voted */}
                    {election.hasVoted && votedElections[election.id] && (
                      <div className="mt-4 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                        <div className="flex items-center space-x-2 mb-2">
                          <ShieldCheck className="h-4 w-4 text-green-400" />
                          <span className="text-xs font-semibold text-green-400">BLOCKCHAIN VERIFIED</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">Your Vote Hash:</p>
                        <div className="flex items-start space-x-2">
                          <Hash className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                          <p className="text-xs text-green-300 font-mono break-all bg-dark-primary/50 p-2 rounded flex-1">
                            {votedElections[election.id]}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedElection?.id === election.id && !election.hasVoted && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-sm text-blockchain-accent flex items-center">
                          <Zap className="h-4 w-4 mr-2" />
                          Ready to vote in this election
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Voting Section */}
          {selectedElection && (
            <>
              {/* Already Voted Message */}
              {selectedElection.hasVoted ? (
                <Card className="bg-green-500/10 border border-green-500/30 mb-8">
                  <CardContent className="p-8 text-center">
                    <div className="flex items-center justify-center mb-4">
                      <div className="p-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full">
                        <CheckCircle className="h-12 w-12 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">
                      ✅ You Have Already Voted in This Election
                    </h3>
                    <p className="text-gray-300 mb-4">
                      Your vote has been securely recorded on the blockchain and cannot be changed.
                    </p>
                    {selectedElection.userVote && (
                      <div className="bg-dark-secondary/50 p-4 rounded-lg border border-green-500/20 max-w-2xl mx-auto">
                        <p className="text-sm text-gray-400 mb-2">Blockchain Transaction Hash:</p>
                        <p className="text-xs text-green-400 font-mono break-all">
                          {selectedElection.userVote.transactionHash}
                        </p>
                        <p className="text-xs text-gray-500 mt-3">
                          Voted on: {new Date(selectedElection.userVote.timestamp).toLocaleString()}
                        </p>
                      </div>
                    )}
                    <div className="mt-6">
                      <p className="text-gray-400 mb-4">
                        {activeElections.filter(e => !e.hasVoted).length > 0 
                          ? 'Select another election above to cast your vote'
                          : 'You have completed all available elections'}
                      </p>
                      <div className="flex flex-wrap gap-3 justify-center">
                        <Button 
                          onClick={() => router.push('/results')} 
                          variant="outline"
                          className="border-blockchain-primary/30 text-blockchain-accent hover:bg-blockchain-primary/10"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Results
                        </Button>
                        <Button 
                          onClick={() => router.push('/profile')}
                          className="purple-gradient neon-glow"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Back to Profile
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Election Info */}
                  <Card className="mb-8 glass-card border-blockchain-primary/30">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-semibold text-white mb-2">
                            {selectedElection.title}
                          </h3>
                          <p className="text-gray-400 text-lg">
                            {selectedElection.description}
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            Ends: {new Date(selectedElection.endDate).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3 text-green-400">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-lg font-medium">Election Active</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Candidates */}
                  <div ref={candidatesRef} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {candidates.map((candidate) => (
                      <Card 
                        key={candidate.id}
                        className={`cursor-pointer transition-all duration-300 glass-card border-2 hover:scale-105 ${
                          selectedCandidate === candidate.id 
                            ? 'border-blockchain-primary bg-blockchain-primary/20 neon-glow scale-105' 
                            : `${getColorClasses(candidate.color)} hover:neon-glow`
                        }`}
                        onClick={() => setSelectedCandidate(candidate.id!)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-4">
                            <div className="text-5xl">{candidate.symbol}</div>
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-white mb-1">{candidate.name}</h3>
                              <p className="text-gray-400">{candidate.party}</p>
                            </div>
                            {selectedCandidate === candidate.id && (
                              <div className="flex items-center justify-center w-12 h-12 purple-gradient rounded-full neon-glow">
                                <Check className="h-6 w-6 text-white" />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Vote Button */}
                  <div className="text-center mb-8">
                    <Button
                      onClick={handleVote}
                      disabled={!selectedCandidate || isVoting}
                      size="lg"
                      className="px-16 py-6 text-xl purple-gradient hover:scale-110 transition-all duration-300 neon-glow disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isVoting ? (
                        <div className="flex items-center space-x-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          <span>Processing Vote...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3">
                          <Vote className="h-6 w-6" />
                          <span>Cast Vote</span>
                          <Zap className="h-6 w-6" />
                        </div>
                      )}
                    </Button>
                    
                    {!selectedCandidate && (
                      <p className="text-gray-500 mt-4 text-lg">
                        Please select a candidate to cast your vote
                      </p>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* Security Notice */}
          <Card className="bg-blue-500/10 border border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <AlertCircle className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
                <div className="text-blue-300">
                  <p className="font-medium mb-2 text-lg">Blockchain Security:</p>
                  <p className="text-blue-200">
                    Each vote you cast is added as a new block to the distributed blockchain ledger. Every user stores a copy
                    of all blocks, making tampering virtually impossible. Once cast, your votes cannot be changed or deleted. 
                    You can vote once in each active election, and each vote is tracked independently with its own blockchain hash.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
