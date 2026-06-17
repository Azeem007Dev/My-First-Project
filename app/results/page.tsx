'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';
import ThreeBackground from '@/components/ThreeBackground';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { gsap } from 'gsap';
import { 
  Eye, BarChart3, Users, Clock, CheckCircle, AlertCircle, Trophy, Zap, Shield, Link2,
  TrendingUp, PieChart, Activity, Award, Target, Calendar, Vote
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, 
  PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, 
  Area, AreaChart, Legend
} from 'recharts';

interface ElectionResult {
  candidateId: string;
  name: string;
  party: string;
  symbol: string;
  votes: number;
  percentage: number;
  color: string;
}

interface ElectionData {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: string;
  totalVotes: number;
  results: ElectionResult[];
  blockchainStats: BlockchainStats;
}

interface User {
  uid: string;
  name: string;
  cnic: string;
  isAdmin: boolean;
}

interface BlockchainStats {
  isIntegritySafe: boolean;
  matchPercentage: number;
  totalBlocks: number;
  totalVotes: number;
}

export default function Results() {
  const [user, setUser] = useState<User | null>(null);
  const [elections, setElections] = useState<ElectionData[]>([]);
  const [selectedElection, setSelectedElection] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const headerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const winnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) {
          router.push('/signin');
          return;
        }
        
        const userParsed = JSON.parse(userData);
        setUser(userParsed);

        // Import services
        const { DatabaseService } = await import('@/lib/database');
        const { BlockchainDatabaseService } = await import('@/lib/blockchain-database');
        
        // Get all elections
        const allElections = await DatabaseService.getElections();
        
        console.log('📊 Results Page - All elections:', allElections.map(e => ({
          id: e.id,
          title: e.title,
          status: e.status,
          createdAt: e.createdAt
        })));
        
        if (allElections.length === 0) {
          console.log('📊 Results Page - No elections found');
          setIsLoading(false);
          return;
        }

        // Get candidates
        const allCandidates = await DatabaseService.getCandidates();
        
        // Process each election
        const electionsData: ElectionData[] = [];
        
        for (const election of allElections) {
          // Get vote statistics
          const voteStats = await DatabaseService.getVoteStatistics(election.id!);
          
          // Build results from the vote statistics
          const electionResults: ElectionResult[] = voteStats.candidateResults.map(result => {
            const candidate = allCandidates.find(c => c.id === result.candidateId);
            const percentage = voteStats.totalVotes > 0 ? (result.votes / voteStats.totalVotes) * 100 : 0;
            
            return {
              candidateId: result.candidateId,
              name: result.candidateName,
              party: candidate?.party || 'Unknown',
              symbol: candidate?.symbol || '❓',
              votes: result.votes,
              percentage: Math.round(percentage * 100) / 100,
              color: candidate?.color || 'gray',
            };
          }).sort((a, b) => b.votes - a.votes);

          // Verify blockchain integrity
          const blockchainIntegrity = await BlockchainDatabaseService.verifyBlockchainIntegrity();
          
          const blockchainStats: BlockchainStats = {
            isIntegritySafe: blockchainIntegrity.isIntegritySafe,
            matchPercentage: blockchainIntegrity.matchPercentage,
            totalBlocks: blockchainIntegrity.consensusChain.length,
            totalVotes: blockchainIntegrity.consensusChain.length - 1, // Exclude genesis
          };

          electionsData.push({
            id: election.id!,
            title: election.title,
            description: election.description,
            startDate: election.startDate,
            endDate: election.endDate,
            status: election.status,
            totalVotes: voteStats.totalVotes,
            results: electionResults,
            blockchainStats
          });
        }

        // Sort elections by creation date (newest first)
        electionsData.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        
        setElections(electionsData);
        
        // Set the first election as selected (most recent)
        if (electionsData.length > 0) {
          setSelectedElection(electionsData[0].id);
        }

        setIsLoading(false);

        // Animate elements after data loads
        setTimeout(() => {
          const tl = gsap.timeline();
          
          if (headerRef.current) {
            tl.fromTo(headerRef.current,
              { y: -50, opacity: 0 },
              { y: 0, opacity: 1, duration: 1, ease: "power2.out" }
            );
          }

          if (resultsRef.current && resultsRef.current.children.length > 0) {
            tl.fromTo(resultsRef.current.children,
              { x: -100, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: "power2.out" },
              "-=0.8"
            );
          }
        }, 100);
      } catch (error) {
        console.error('Error loading results:', error);
        setIsLoading(false);
      }
    };

    loadResults();
  }, [router]);

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'from-blue-400 to-blue-600',
      green: 'from-green-400 to-green-600',
      purple: 'from-purple-400 to-purple-600',
      orange: 'from-orange-400 to-orange-600',
    };
    return colorMap[color as keyof typeof colorMap] || 'from-gray-400 to-gray-600';
  };

  const getBorderClasses = (color: string) => {
    const colorMap = {
      blue: 'border-blue-400/50 bg-blue-500/10',
      green: 'border-green-400/50 bg-green-500/10',
      purple: 'border-purple-400/50 bg-purple-500/10',
      orange: 'border-orange-400/50 bg-orange-500/10',
    };
    return colorMap[color as keyof typeof colorMap] || 'border-gray-400/50 bg-gray-500/10';
  };

  const getCurrentElection = () => {
    return elections.find(e => e.id === selectedElection) || elections[0];
  };

  const prepareChartData = (results: ElectionResult[]) => {
    return results.map(result => ({
      name: result.name,
      votes: result.votes,
      percentage: result.percentage,
      party: result.party,
      symbol: result.symbol,
      color: result.color
    }));
  };

  const getChartColors = (results: ElectionResult[]) => {
    const colorMap = {
      blue: '#3B82F6',
      green: '#10B981',
      purple: '#8B5CF6',
      orange: '#F59E0B',
      gray: '#6B7280'
    };
    return results.map(result => colorMap[result.color as keyof typeof colorMap] || '#6B7280');
  };

  const chartConfig = {
    votes: {
      label: "Votes",
      color: "hsl(var(--chart-1))",
    },
    percentage: {
      label: "Percentage",
      color: "hsl(var(--chart-2))",
    },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-primary">
        <ThreeBackground variant="particles" />
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blockchain-primary mx-auto mb-4"></div>
            <p className="text-gray-400 text-lg">Loading election results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (elections.length === 0) {
    return (
      <div className="min-h-screen bg-dark-primary">
        <ThreeBackground variant="minimal" />
        <Navigation />
        <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center glass-card border-yellow-500/30">
            <CardContent className="p-12">
              <div className="flex items-center justify-center mb-8">
                <div className="p-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full neon-glow pulse-glow">
                  <BarChart3 className="h-16 w-16 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-6">
                No Elections Found
              </h2>
              <p className="text-gray-300 mb-8 text-lg">
                There are no elections available to display results for.
              </p>
              <Button 
                onClick={() => router.push('/vote')} 
                variant="outline"
                className="border-blockchain-primary/30 text-blockchain-accent hover:bg-blockchain-primary/10"
              >
                Go to Voting
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentElection = getCurrentElection();
  const hasEndedElections = elections.some(e => e.status === 'ended');

  if (!hasEndedElections) {
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
                Elections Still Active
              </h2>
              <p className="text-gray-300 mb-8 text-lg">
                Results will be available once elections are closed by the administrator.
              </p>
              <Button 
                onClick={() => router.push('/vote')} 
                variant="outline"
                className="border-blockchain-primary/30 text-blockchain-accent hover:bg-blockchain-primary/10"
              >
                Cast Your Vote
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-primary">
      <ThreeBackground variant="ledger" />
      <Navigation />
      
      <div className="relative min-h-[calc(100vh-4rem)]">
        <div className="cyber-grid absolute inset-0 opacity-10"></div>
        
        <div className="relative max-w-7xl mx-auto p-4 py-8 z-10">
          {/* Header */}
          <div ref={headerRef} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 purple-gradient rounded-full mb-6 neon-glow pulse-glow">
              <BarChart3 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold gradient-text neon-text mb-4">Election Results</h1>
            <p className="text-gray-400 text-lg">Comprehensive Election Analysis & Statistics</p>
          </div>

          {/* Election Selection */}
          {elections.length > 1 && (
            <Card className="mb-8 glass-card border-blockchain-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-blockchain-primary" />
                  <span>Select Election</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {elections.map((election) => (
                    <Button
                      key={election.id}
                      variant={selectedElection === election.id ? "default" : "outline"}
                      className={`p-4 h-auto flex flex-col items-start space-y-2 ${
                        selectedElection === election.id 
                          ? 'bg-blockchain-primary text-white' 
                          : 'border-blockchain-primary/30 text-blockchain-accent hover:bg-blockchain-primary/10'
                      }`}
                      onClick={() => setSelectedElection(election.id)}
                    >
                      <div className="font-semibold text-left">{election.title}</div>
                      <div className="text-sm opacity-80">
                        {new Date(election.startDate).toLocaleDateString()} - {new Date(election.endDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className={`px-2 py-1 rounded-full ${
                          election.status === 'ended' 
                            ? 'bg-green-500/20 text-green-400' 
                            : election.status === 'active'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {election.status}
                        </span>
                        <span>{election.totalVotes} votes</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Results Content */}
          {currentElection && (
            <Tabs defaultValue="overview" className="space-y-8">
              <TabsList className="grid w-full grid-cols-4 glass-card border-blockchain-primary/30">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="results">Detailed Results</TabsTrigger>
                <TabsTrigger value="charts">Charts & Graphs</TabsTrigger>
                <TabsTrigger value="statistics">Statistics</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-8">
                {/* Election Summary */}
                <Card className="glass-card border-blockchain-primary/30">
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-3">
                          <Users className="h-6 w-6 text-blockchain-primary mr-3" />
                          <span className="text-lg font-medium text-gray-400">Total Votes</span>
                        </div>
                        <p className="text-3xl font-bold gradient-text">{currentElection.totalVotes.toLocaleString()}</p>
                      </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-3">
                            <Clock className="h-6 w-6 text-blue-400 mr-3" />
                            <span className="text-lg font-medium text-gray-400">Status</span>
                          </div>
                          <p className={`text-2xl font-bold ${currentElection.status === 'ended' ? 'text-green-400' : 'text-blue-400'}`}>{currentElection.status === 'ended' ? 'Ended' : 'Active'}</p>
                        </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-3">
                          <Award className="h-6 w-6 text-green-400 mr-3" />
                          <span className="text-lg font-medium text-gray-400">Candidates</span>
                        </div>
                        <p className="text-3xl font-bold text-green-400">{currentElection.results.length}</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-3">
                          <Shield className="h-6 w-6 text-blue-400 mr-3" />
                          <span className="text-lg font-medium text-gray-400">Blockchain Blocks</span>
                        </div>
                        <p className="text-3xl font-bold text-blue-400">{currentElection.blockchainStats?.totalBlocks || 0}</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-3">
                          <CheckCircle className="h-6 w-6 text-purple-400 mr-3" />
                          <span className="text-lg font-medium text-gray-400">Integrity</span>
                        </div>
                        <p className="text-3xl font-bold text-purple-400">
                          {currentElection.blockchainStats?.matchPercentage?.toFixed(1) || 0}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Winner Announcement */}
                {currentElection.results.length > 0 && (
                  <Card ref={winnerRef} className={`glass-card border-2 ${getBorderClasses(currentElection.results[0].color)} cyber-border`}>
                    <CardContent className="p-10">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-8">
                          <div className="p-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full neon-glow pulse-glow">
                            <Trophy className="h-12 w-12 text-white" />
                          </div>
                        </div>
                        <h2 className="text-3xl font-bold gradient-text neon-text mb-6">Election Winner</h2>
                        <div className="flex items-center justify-center space-x-6 mb-6">
                          <span className="text-6xl">{currentElection.results[0].symbol}</span>
                          <div>
                            <h3 className="text-2xl font-bold text-white">{currentElection.results[0].name}</h3>
                            <p className="text-gray-400 text-lg">{currentElection.results[0].party}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-center space-x-8 text-lg text-gray-300">
                          <span><strong className="text-blockchain-accent">{currentElection.results[0].votes.toLocaleString()}</strong> votes</span>
                          <span><strong className="text-blockchain-accent">{currentElection.results[0].percentage}%</strong> of total votes</span>
                        </div>
                        {/* Display 2nd and 3rd position candidates if available */}
                        <div className="mt-10">
                          <h3 className="text-xl font-semibold text-white mb-4">2nd & 3rd Position</h3>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentElection.results.slice(1, 3).map((candidate, idx) => (
                              <li key={candidate.candidateId} className="flex items-center space-x-4 bg-dark-secondary/50 p-4 rounded-lg">
                                <span className="text-3xl">{candidate.symbol}</span>
                                <div>
                                  <span className="font-bold text-white">{candidate.name}</span>
                                  <span className="block text-gray-400 text-sm">{candidate.party}</span>
                                  <span className="block text-gray-400 text-xs">Position: {idx + 2}</span>
                                </div>
                                <span className="ml-auto font-semibold text-blockchain-accent">{candidate.votes} votes ({candidate.percentage}%)</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {/* Show all candidates with at least 1 vote */}
                        <div className="mt-10">
                          <h3 className="text-xl font-semibold text-white mb-4">All Candidates with Votes</h3>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentElection.results.filter(candidate => candidate.votes > 0).map((candidate) => (
                              <li key={candidate.candidateId} className="flex items-center space-x-4 bg-dark-secondary/50 p-4 rounded-lg">
                                <span className="text-3xl">{candidate.symbol}</span>
                                <div>
                                  <span className="font-bold text-white">{candidate.name}</span>
                                  <span className="block text-gray-400 text-sm">{candidate.party}</span>
                                </div>
                                <span className="ml-auto font-semibold text-blockchain-accent">{candidate.votes} votes ({candidate.percentage}%)</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Top 3 Podium */}
                {currentElection.results.length >= 3 && (
                  <Card className="glass-card border-blockchain-primary/30">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-3 text-2xl">
                        <Trophy className="h-6 w-6 text-yellow-400" />
                        <span className="gradient-text">Top 3 Candidates</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-center items-end space-x-8 mb-8">
                        {/* 2nd Place */}
                        {currentElection.results[1] && (
                          <div className="text-center">
                            <div className="relative mb-4">
                              <div className="w-20 h-24 bg-gradient-to-t from-gray-600 to-gray-400 rounded-t-lg mx-auto relative">
                                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                                  <span className="text-2xl">{currentElection.results[1].symbol}</span>
                                </div>
                              </div>
                              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold">2</span>
                              </div>
                            </div>
                            <h4 className="font-bold text-white text-lg">{currentElection.results[1].name}</h4>
                            <p className="text-gray-400">{currentElection.results[1].party}</p>
                            <p className="text-blockchain-accent font-semibold">{currentElection.results[1].votes.toLocaleString()} votes</p>
                            <p className="text-gray-400 text-sm">{currentElection.results[1].percentage}%</p>
                          </div>
                        )}

                        {/* 1st Place */}
                        <div className="text-center">
                          <div className="relative mb-4">
                            <div className="w-24 h-32 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t-lg mx-auto relative">
                              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                                <span className="text-3xl">{currentElection.results[0].symbol}</span>
                              </div>
                            </div>
                            <div className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                              <Trophy className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <h4 className="font-bold text-white text-xl">{currentElection.results[0].name}</h4>
                          <p className="text-gray-400">{currentElection.results[0].party}</p>
                          <p className="text-blockchain-accent font-semibold">{currentElection.results[0].votes.toLocaleString()} votes</p>
                          <p className="text-gray-400 text-sm">{currentElection.results[0].percentage}%</p>
                        </div>

                        {/* 3rd Place */}
                        {currentElection.results[2] && (
                          <div className="text-center">
                            <div className="relative mb-4">
                              <div className="w-20 h-20 bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-lg mx-auto relative">
                                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                                  <span className="text-2xl">{currentElection.results[2].symbol}</span>
                                </div>
                              </div>
                              <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold">3</span>
                              </div>
                            </div>
                            <h4 className="font-bold text-white text-lg">{currentElection.results[2].name}</h4>
                            <p className="text-gray-400">{currentElection.results[2].party}</p>
                            <p className="text-blockchain-accent font-semibold">{currentElection.results[2].votes.toLocaleString()} votes</p>
                            <p className="text-gray-400 text-sm">{currentElection.results[2].percentage}%</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Detailed Results Tab */}
              <TabsContent value="results" className="space-y-8">
                <Card className="glass-card border-blockchain-primary/30">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3 text-2xl">
                      <BarChart3 className="h-6 w-6 text-blockchain-primary" />
                      <span className="gradient-text">Complete Results</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent ref={resultsRef} className="space-y-6">
                    {currentElection.results.map((result, index) => (
                      <div key={result.candidateId} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl font-bold text-gray-500">#{index + 1}</span>
                              {index < 3 && (
                                <div className="flex items-center space-x-1">
                                  {index === 0 && <Trophy className="h-5 w-5 text-yellow-400" />}
                                  {index === 1 && <Award className="h-5 w-5 text-gray-400" />}
                                  {index === 2 && <Award className="h-5 w-5 text-orange-400" />}
                                </div>
                              )}
                            </div>
                            <span className="text-3xl">{result.symbol}</span>
                            <div>
                              <h4 className="font-semibold text-white text-xl">{result.name}</h4>
                              <p className="text-gray-400">{result.party}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-white">{result.votes.toLocaleString()}</p>
                            <p className="text-gray-400">{result.percentage}%</p>
                          </div>
                        </div>
                        <div className="w-full bg-dark-secondary/50 rounded-full h-4 overflow-hidden">
                          <div 
                            className={`h-4 rounded-full transition-all duration-1000 bg-gradient-to-r ${getColorClasses(result.color)} neon-glow`}
                            style={{ width: `${result.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Charts & Graphs Tab */}
              <TabsContent value="charts" className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Bar Chart */}
                  <Card className="glass-card border-blockchain-primary/30">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-3">
                        <BarChart3 className="h-5 w-5 text-blockchain-primary" />
                        <span>Vote Distribution</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[300px]">
                        <BarChart data={prepareChartData(currentElection.results)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis 
                            dataKey="name" 
                            stroke="rgba(255,255,255,0.6)"
                            fontSize={12}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="votes" fill="var(--color-votes)" />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  {/* Pie Chart */}
                  <Card className="glass-card border-blockchain-primary/30">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-3">
                        <PieChart className="h-5 w-5 text-blockchain-primary" />
                        <span>Vote Percentage</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[300px]">
                        <RechartsPieChart>
                          <Pie
                            data={prepareChartData(currentElection.results)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="votes"
                          >
                            {prepareChartData(currentElection.results).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getChartColors(currentElection.results)[index]} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </RechartsPieChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  {/* Area Chart */}
                  <Card className="glass-card border-blockchain-primary/30 lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-3">
                        <TrendingUp className="h-5 w-5 text-blockchain-primary" />
                        <span>Vote Distribution Trend</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[300px]">
                        <AreaChart data={prepareChartData(currentElection.results)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis 
                            dataKey="name" 
                            stroke="rgba(255,255,255,0.6)"
                            fontSize={12}
                          />
                          <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Area 
                            type="monotone" 
                            dataKey="votes" 
                            stroke="var(--color-votes)" 
                            fill="var(--color-votes)"
                            fillOpacity={0.3}
                          />
                        </AreaChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Statistics Tab */}
              <TabsContent value="statistics" className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Election Statistics */}
                  <Card className="glass-card border-blockchain-primary/30">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-3">
                        <Activity className="h-5 w-5 text-blockchain-primary" />
                        <span>Election Statistics</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-dark-secondary/50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Total Votes</span>
                            <Vote className="h-4 w-4 text-blockchain-primary" />
                          </div>
                          <p className="text-2xl font-bold text-white">{currentElection.totalVotes.toLocaleString()}</p>
                        </div>
                        <div className="bg-dark-secondary/50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Candidates</span>
                            <Users className="h-4 w-4 text-green-400" />
                          </div>
                          <p className="text-2xl font-bold text-white">{currentElection.results.length}</p>
                        </div>
                        <div className="bg-dark-secondary/50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Winner Votes</span>
                            <Trophy className="h-4 w-4 text-yellow-400" />
                          </div>
                          <p className="text-2xl font-bold text-white">
                            {currentElection.results[0]?.votes.toLocaleString() || 0}
                          </p>
                        </div>
                        <div className="bg-dark-secondary/50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Winner %</span>
                            <Target className="h-4 w-4 text-purple-400" />
                          </div>
                          <p className="text-2xl font-bold text-white">
                            {currentElection.results[0]?.percentage.toFixed(1) || 0}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Blockchain Statistics */}
                  <Card className="glass-card border-blockchain-primary/30">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-blockchain-primary" />
                        <span>Blockchain Statistics</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-dark-secondary/50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Total Blocks</span>
                            <Link2 className="h-4 w-4 text-blue-400" />
                          </div>
                          <p className="text-2xl font-bold text-white">{currentElection.blockchainStats?.totalBlocks || 0}</p>
                        </div>
                        <div className="bg-dark-secondary/50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Integrity</span>
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          </div>
                          <p className="text-2xl font-bold text-white">
                            {currentElection.blockchainStats?.matchPercentage?.toFixed(1) || 0}%
                          </p>
                        </div>
                        <div className="bg-dark-secondary/50 p-4 rounded-lg lg:col-span-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Status</span>
                            {currentElection.blockchainStats?.isIntegritySafe ? (
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-yellow-400" />
                            )}
                          </div>
                          <p className={`text-lg font-semibold ${
                            currentElection.blockchainStats?.isIntegritySafe ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            {currentElection.blockchainStats?.isIntegritySafe ? 'Verified & Secure' : 'Verification Pending'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}