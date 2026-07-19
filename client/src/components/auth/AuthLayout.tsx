import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from '../theme/ThemeToggle';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white dark:bg-dark-950">
      {/* Left: Brand Side with Animated Gradient */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden gradient-rainbow">
        {/* Animated floating particles */}
        <div className="float-particle-1" />
        <div className="float-particle-2" />
        <div className="float-particle-3" />

        {/* Additional decorative elements */}
        <div className="absolute inset-0">
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 w-full">
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">ConnectWorld</h1>
                <p className="text-white/60 text-sm font-medium mt-0.5">Enterprise Collaboration</p>
              </div>
            </div>
          </div>

          <h2 className="text-5xl font-bold text-white mb-6 leading-[1.1] tracking-tight animate-fade-in-up">
            Connect,<br />
            <span className="text-white/80">Collaborate,</span><br />
            <span className="bg-white/10 backdrop-blur-sm px-2 -ml-2 inline-block rounded-lg">Create Together</span>
          </h2>

          <p className="text-white/70 text-lg leading-relaxed max-w-md mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Enterprise-grade video conferencing and real-time collaboration platform designed for modern, distributed teams.
          </p>

          <div className="space-y-5 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {[
              { icon: '🎥', text: 'HD Video Conferencing', desc: 'Crystal clear video with adaptive quality' },
              { icon: '🤝', text: 'Real-Time Collaboration', desc: 'Share screens, whiteboard, and files instantly' },
              { icon: '🔒', text: 'Enterprise Security', desc: 'End-to-end encryption and SSO integration' },
            ].map((feature) => (
              <div
                key={feature.text}
                className="flex items-start gap-4 group cursor-default"
              >
                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
                  <span className="text-lg">{feature.icon}</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{feature.text}</p>
                  <p className="text-white/50 text-xs mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom decorative gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/10 to-transparent" />
        </div>
      </div>

      {/* Right: Auth Form Side */}
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-dark-950 p-8 relative">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-100/30 dark:bg-brand-900/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-100/20 dark:bg-accent-900/10 rounded-full blur-3xl" />
        </div>

        {/* Desktop Theme Toggle - top right */}
        <div className="hidden md:block absolute top-6 right-6 z-10">
          <ThemeToggle variant="glass" />
        </div>

        <div className="w-full max-w-md relative">
          {/* Theme Toggle - top right */}
          <div className="absolute top-0 right-0 z-10">
            <ThemeToggle variant="minimal" />
          </div>

          {/* Back to home logo */}
          <a
            href="/login"
            className="group inline-flex items-center gap-3 mb-10 hover:opacity-80 transition-opacity"
          >
            <div className="w-11 h-11 gradient-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/10 group-hover:shadow-brand-500/20 transition-shadow">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-left">
              <span className="text-lg font-bold text-dark-900 dark:text-white block">ConnectWorld</span>
              <span className="text-xs text-dark-400">Enterprise Collaboration</span>
            </div>
          </a>

          {children}
        </div>
      </div>
    </div>
  );
}
