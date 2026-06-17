'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import ThreeBackground from '@/components/ThreeBackground';
import { gsap } from 'gsap';
import {
  Shield,
  Eye,
  Lock,
  Vote,
  ArrowRight,
  CheckCircle,
  Users,
  Globe,
  Zap,
  Star,
  UserPlus
} from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // GSAP Animations
    const tl = gsap.timeline();

    // Hero animations
    if (heroRef.current) {
      tl.fromTo(heroRef.current.querySelector('h1'),
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: "power3.out" }
      )
        .fromTo(heroRef.current.querySelector('p'),
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: "power2.out" },
          "-=0.8"
        )
        .fromTo(heroRef.current.querySelector('.cta-buttons'),
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
          "-=0.6"
        );
    }

    // Stats animation
    if (statsRef.current) {
      gsap.fromTo(statsRef.current.children,
        { y: 50, opacity: 0, scale: 0.8 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "back.out(1.7)",
          delay: 0.5
        }
      );
    }

    // Benefits animation
    if (benefitsRef.current) {
      gsap.fromTo(benefitsRef.current.children,
        { y: 80, opacity: 0, rotationY: 45 },
        {
          y: 0,
          opacity: 1,
          rotationY: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power2.out",
          delay: 1
        }
      );
    }
  }, []);

  const benefits = [
    {
      icon: Shield,
      title: 'Transparent',
      description: 'Every vote is recorded on the blockchain, ensuring complete transparency and auditability.',
      color: 'text-green-400',
      gradient: 'from-green-400 to-emerald-500'
    },
    {
      icon: Lock,
      title: 'Secure',
      description: 'Advanced cryptographic protection ensures your vote cannot be tampered with or compromised.',
      color: 'text-blue-400',
      gradient: 'from-blue-400 to-cyan-500'
    },
    {
      icon: CheckCircle,
      title: 'Immutable',
      description: 'Once cast, votes cannot be altered or deleted, guaranteeing the integrity of the election.',
      color: 'text-purple-400',
      gradient: 'from-purple-400 to-pink-500'
    },
    {
      icon: Eye,
      title: 'Verifiable',
      description: 'Real-time verification allows voters to confirm their vote was counted accurately.',
      color: 'text-orange-400',
      gradient: 'from-orange-400 to-red-500'
    }
  ];

  const stats = [
    { icon: Users, value: '10,000+', label: 'Registered Voters', color: 'text-blue-400' },
    { icon: Vote, value: '50+', label: 'Elections Conducted', color: 'text-green-400' },
    { icon: Globe, value: '99.9%', label: 'System Uptime', color: 'text-purple-400' },
    { icon: Shield, value: '100%', label: 'Security Score', color: 'text-orange-400' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <ThreeBackground variant="nodes" />
      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4">
        <div className="cyber-grid absolute inset-0 opacity-10"></div>
        <div ref={heroRef} className="relative max-w-6xl mx-auto text-center z-10">
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            <span className="gradient-text neon-text">Vote Ledger</span>
            <br />
            <span className="text-3xl md:text-5xl font-normal text-gray-300 block mt-4">
              Secure Blockchain Voting
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            Experience the future of democratic participation with our transparent,
            secure, and immutable blockchain-based voting system.
          </p>
          <div className="cta-buttons flex flex-col sm:flex-row justify-center gap-6">
            {user ? (
              <Link href="/vote">
                <Button size="lg" className="group px-8 py-4 text-lg purple-gradient hover:scale-105 transition-all duration-300 neon-glow">
                  <Vote className="h-6 w-6 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                  <span>Cast Your Vote</span>
                  <ArrowRight className="h-6 w-6 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signin">
                  <Button size="lg" className="group px-8 py-4 text-lg purple-gradient hover:scale-105 transition-all duration-300 neon-glow">
                    <span>Sign In</span>
                    <ArrowRight className="h-6 w-6 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="lg" variant="outline" className="px-8 py-4 text-lg border-purple-500/50 text-purple-300 hover:bg-purple-500/20 hover:scale-105 transition-all duration-300">
                    <UserPlus className="h-6 w-6 mr-3" />
                    <span>Sign Up</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative">
        <div className="particle-bg absolute inset-0"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(({ icon: Icon, value, label, color }, index) => (
              <div key={label} className="text-center group">
                <div className="glass-card p-6 rounded-xl hover:scale-105 transition-all duration-300 hover:pulse-glow">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 purple-gradient`}>
                    <Icon className={`h-8 w-8 text-white`} />
                  </div>
                  <div className={`text-3xl font-bold mb-2 ${color} neon-text`}>{value}</div>
                  <div className="text-gray-400 text-sm">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="gradient-text">Why Choose Vote Ledger?</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Our blockchain-based voting system provides unparalleled security,
              transparency, and trust in the democratic process.
            </p>
          </div>

          <div ref={benefitsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map(({ icon: Icon, title, description, color, gradient }, index) => (
              <Card
                key={title}
                className="group glass-card border-purple-500/30 hover:border-purple-500/60 transition-all duration-500 hover:scale-105 floating-animation"
                style={{ animationDelay: `${index * 0.5}s` }}
              >
                <CardContent className="p-8 text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 bg-gradient-to-r ${gradient} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-purple-300 transition-colors duration-300">
                    {title}
                  </h3>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                    {description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="cyber-grid absolute inset-0 opacity-5"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="glass-card p-12 rounded-2xl cyber-border">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="gradient-text neon-text">Ready to Experience Secure Voting?</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of voters who trust Vote Ledger for transparent and secure elections.
            </p>
            {!user && (
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link href="/signup">
                  <Button size="lg" className="group px-8 py-4 text-lg purple-gradient hover:scale-105 transition-all duration-300 neon-glow">
                    <Star className="h-6 w-6 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                    Get Started Today
                  </Button>
                </Link>
                <Link href="/signin">
                  <Button size="lg" variant="outline" className="px-8 py-4 text-lg border-purple-500/50 text-purple-300 hover:bg-purple-500/20 hover:scale-105 transition-all duration-300">
                    <Zap className="h-6 w-6 mr-3" />
                    Already Registered?
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900/50 text-white py-12 border-t border-purple-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 purple-gradient rounded-lg neon-glow">
              <Vote className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Vote Ledger</span>
          </div>
          <p className="text-gray-400 mb-4">
            Securing democracy through blockchain technology
          </p>
          <p className="text-sm text-gray-500">
            © 2024 Vote Ledger. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}