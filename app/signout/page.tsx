'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import ThreeBackground from '@/components/ThreeBackground';
import { gsap } from 'gsap';
import { CheckCircle, LogOut, Home, Sparkles } from 'lucide-react';

export default function SignOut() {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clear user session
    localStorage.removeItem('user');
    localStorage.removeItem('hasVoted');
    localStorage.removeItem('votedCandidate');
    localStorage.removeItem('transactionHash');

    // Animate card entrance
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        { y: 100, opacity: 0, scale: 0.8, rotation: -180 },
        { y: 0, opacity: 1, scale: 1, rotation: 0, duration: 1.2, ease: "back.out(1.7)" }
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-dark-primary">
      <ThreeBackground variant="minimal" />
      <Navigation />
      
      <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="particle-bg absolute inset-0 opacity-20"></div>
        
        <Card ref={cardRef} className="w-full max-w-md relative z-10 glass-card border-green-500/30 text-center cyber-border">
          <CardContent className="p-12">
            <div className="flex items-center justify-center mb-8">
              <div className="p-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full neon-glow pulse-glow">
                <CheckCircle className="h-16 w-16 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold gradient-text neon-text mb-6">
              Successfully Signed Out
            </h2>
            <p className="text-gray-300 mb-10 text-lg">
              Your session has been securely ended. Thank you for using Vote Ledger.
            </p>
            
            <div className="space-y-4">
              <Button 
                onClick={() => router.push('/signin')} 
                className="w-full flex items-center justify-center space-x-2 py-3 text-lg purple-gradient hover:scale-105 transition-all duration-300 neon-glow"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign In Again</span>
              </Button>
              
              <Button 
                onClick={() => router.push('/')} 
                variant="outline"
                className="w-full border-blockchain-primary/30 text-blockchain-accent hover:bg-blockchain-primary/10 hover:border-blockchain-primary/50 transition-all duration-300"
              >
                <Home className="h-5 w-5 mr-2" />
                Return to Home
              </Button>
            </div>
            
            <div className="mt-10 pt-6 border-t border-blockchain-primary/30">
              <p className="text-sm text-gray-400">
                For your security, we recommend closing your browser if you're on a shared computer.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}