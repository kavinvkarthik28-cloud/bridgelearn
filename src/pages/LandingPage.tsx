import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  GraduationCap,
  MessageSquare,
  Languages,
  BookOpen,
  ArrowRight,
  Sparkles,
  Users,
  Trophy,
} from 'lucide-react';

export function LandingPage() {
  const { user } = useAuth();

  const features = [
    {
      icon: Languages,
      title: 'Multi-Language Support',
      description: 'Learn in Tamil, Hindi, Telugu, or English - your choice, your comfort.',
    },
    {
      icon: MessageSquare,
      title: 'AI-Powered Tutoring',
      description: 'Get instant answers to your questions with our advanced AI tutor.',
    },
    {
      icon: BookOpen,
      title: 'Smart Note Analysis',
      description: 'Upload your notes and let AI help you understand concepts better.',
    },
    {
      icon: Trophy,
      title: 'Track Progress',
      description: 'Monitor your learning journey with detailed statistics and insights.',
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Students' },
    { value: '50,000+', label: 'Questions Answered' },
    { value: '4', label: 'Languages' },
    { value: '95%', label: 'Satisfaction' },
  ];

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Decorative bridge arc motif */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-[50%] border-[3px] border-accent/10"
            style={{ borderTopColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent' }}
          />
          <div
            className="absolute top-24 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-[50%] border-[2px] border-accent/15"
            style={{ borderTopColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent' }}
          />
        </div>

        {/* Navigation */}
        <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-ink font-fraunces">BridgeLearn</span>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <Link
                  to="/dashboard"
                  className="px-5 py-2.5 bg-accent text-cream text-sm font-medium rounded-[8px] hover:bg-accent/90 transition-colors flex items-center gap-2"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/auth"
                    className="px-5 py-2.5 text-ink text-sm font-medium hover:text-primary transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth"
                    className="px-5 py-2.5 bg-accent text-cream text-sm font-medium rounded-[8px] hover:bg-accent/90 transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 sm:pt-24 sm:pb-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary text-sm font-medium rounded-full mb-6">
              <Sparkles className="h-4 w-4" />
              Built for First-Generation Students
            </div>
            <h1 className="font-fraunces text-4xl sm:text-5xl lg:text-6xl font-medium text-ink tracking-tight mb-6">
              Your AI study partner that
              <span className="block text-primary mt-2">speaks your language</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-ink/70 mb-10 font-inter">
              Master your studies with personalized AI tutoring in Tamil, Hindi, Telugu, or English.
              Get instant help, upload your notes, and learn smarter - not harder.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={user ? '/dashboard' : '/auth'}
                className="w-full sm:w-auto px-8 py-4 bg-accent text-cream text-base font-medium rounded-[8px] hover:bg-accent/90 transition-all hover:shadow-lg flex items-center justify-center gap-2"
              >
                {user ? 'Continue Learning' : 'Start Learning Free'}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/auth"
                className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-primary text-primary text-base font-medium rounded-[8px] hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
              >
                <Users className="h-5 w-5" />
                Join 10,000+ Students
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="font-fraunces text-3xl sm:text-4xl font-semibold text-accent">{stat.value}</div>
                <div className="text-sm text-ink/60 mt-1 font-inter">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-fraunces text-3xl sm:text-4xl font-medium text-ink mb-4">
              Everything you need to excel
            </h2>
            <p className="text-lg text-ink/70 max-w-2xl mx-auto font-inter">
              Powerful features designed specifically for first-generation college students in India.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-cream rounded-xl p-6 shadow-sm border-l-4 border-accent hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-fraunces text-lg font-medium text-ink mb-2">{feature.title}</h3>
                <p className="text-ink/60 text-sm font-inter">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-fraunces text-3xl sm:text-4xl font-medium text-cream mb-4">
            Ready to transform your learning?
          </h2>
          <p className="text-cream/80 text-lg mb-8 max-w-2xl mx-auto font-inter">
            Join thousands of students who are already learning smarter with BridgeLearn.
          </p>
          <Link
            to={user ? '/dashboard' : '/auth'}
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-cream font-medium rounded-[8px] hover:bg-accent/90 transition-colors"
          >
            {user ? 'Go to Dashboard' : "Get Started Now - It's Free"}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-ink text-cream/60 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-accent" />
              <span className="text-lg font-semibold text-cream font-fraunces">BridgeLearn</span>
            </div>
            <p className="text-sm font-inter">Made with love for students across India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
