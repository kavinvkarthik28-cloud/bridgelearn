import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Layout } from '../components/Layout';
import {
  MessageSquare,
  Upload,
  Clock,
  TrendingUp,
  BookOpen,
  Award,
  ChevronRight,
  FileText,
  Flame,
} from 'lucide-react';

interface ChatSession {
  id: string;
  title: string;
  language: string;
  created_at: string;
  message_count: number;
}

interface DashboardStats {
  totalChats: number;
  totalMessages: number;
  notesUploaded: number;
  languagesUsed: string[];
}

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalChats: 0,
    totalMessages: 0,
    notesUploaded: 0,
    languagesUsed: [],
  });
  const [recentChats, setRecentChats] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      // Fetch real document count from Supabase
      let notesUploaded = 0;
      try {
        const { count, error } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true });

        if (!error && count !== null) {
          notesUploaded = count;
        }
      } catch (e) {
        console.error('Error fetching document count:', e);
      }

      const mockChats: ChatSession[] = [
        {
          id: "1",
          title: "Understanding Calculus - Derivatives",
          language: "English",
          created_at: "2026-06-13T10:30:00Z",
          message_count: 15,
        },
        {
          id: "2",
          title: "Physics Mechanics Help",
          language: "Hindi",
          created_at: "2026-06-12T15:45:00Z",
          message_count: 23,
        },
        {
          id: "3",
          title: "Chemistry Organic Compounds",
          language: "Tamil",
          created_at: "2026-06-11T09:20:00Z",
          message_count: 8,
        },
        {
          id: "4",
          title: "Biology Cell Structure",
          language: "Telugu",
          created_at: "2026-06-10T14:15:00Z",
          message_count: 12,
        },
      ];
      const mockStats: DashboardStats = {
        totalChats: 15,
        totalMessages: 142,
        notesUploaded: notesUploaded,
        languagesUsed: ['English', 'Hindi', 'Tamil', 'Telugu'],
      };
      setRecentChats(mockChats);
      setStats(mockStats);
      setLoading(false);
    }

    fetchDashboardData();
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  const quickActions = [
    {
      title: 'Start New Chat',
      description: 'Ask questions in your preferred language',
      icon: MessageSquare,
      link: '/chat',
      color: 'accent',
    },
    {
      title: 'Upload Notes',
      description: 'Get AI help with your study materials',
      icon: Upload,
      link: '/upload',
      color: 'sage',
    },
  ];

  const statCards = [
    {
      label: 'Total Chats',
      value: stats.totalChats,
      icon: MessageSquare,
      color: 'sage',
      highlight: false,
    },
    {
      label: 'Messages Sent',
      value: stats.totalMessages,
      icon: TrendingUp,
      color: 'sage',
      highlight: true,
    },
    {
      label: 'Notes Uploaded',
      value: stats.notesUploaded,
      icon: FileText,
      color: 'sage',
      highlight: false,
    },
    {
      label: 'Languages Used',
      value: stats.languagesUsed.length,
      icon: Award,
      color: 'accent',
      highlight: true,
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-cream">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="font-fraunces text-2xl sm:text-3xl font-medium text-ink">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
          </h1>
          <p className="text-ink/60 mt-1 font-inter">Ready to continue your learning journey?</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="bg-cream rounded-xl p-5 border-l-4 shadow-sm hover:shadow-md transition-shadow"
              style={{ borderLeftColor: stat.highlight ? '#E07A5F' : '#81A684' }}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                stat.highlight ? 'bg-accent/10' : 'bg-sage/20'
              }`}>
                <stat.icon className={`h-5 w-5 ${
                  stat.highlight ? 'text-accent' : 'text-sage'
                }`} />
              </div>
              <div className={`font-fraunces text-2xl font-semibold ${
                stat.highlight ? 'text-accent' : 'text-ink'
              }`}>{stat.value}</div>
              <div className="text-sm text-ink/50 font-inter">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className="group bg-cream rounded-xl p-6 border-l-4 shadow-sm hover:shadow-md transition-all"
              style={{ borderLeftColor: action.color === 'accent' ? '#E07A5F' : '#81A684' }}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  action.color === 'accent' ? 'bg-accent/10' : 'bg-sage/20'
                }`}>
                  <action.icon className={`h-6 w-6 ${
                    action.color === 'accent' ? 'text-accent' : 'text-sage'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-fraunces font-medium text-ink group-hover:text-primary transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-ink/50 mt-1 font-inter">{action.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-ink/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Chats */}
        <div className="bg-white rounded-xl border border-cream shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-cream flex items-center justify-between">
            <h2 className="font-fraunces font-medium text-ink flex items-center gap-2">
              <Clock className="h-5 w-5 text-ink/40" />
              Recent Chats
            </h2>
            <Link
              to="/chat"
              className="text-sm text-primary font-medium hover:underline font-inter"
            >
              View All
            </Link>
          </div>

          {recentChats.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <MessageSquare className="h-12 w-12 text-ink/20 mx-auto mb-3" />
              <p className="text-ink/50 font-inter">No chats yet. Start your first conversation!</p>
              <Link
                to="/chat"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-accent text-cream text-sm font-medium rounded-[8px] hover:bg-accent/90 font-inter"
              >
                <MessageSquare className="h-4 w-4" />
                Start Chatting
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-cream">
              {recentChats.map((chat) => (
                <Link
                  key={chat.id}
                  to={`/chat?session=${chat.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-cream/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-ink truncate font-inter">{chat.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-ink/50 font-inter">{chat.language}</span>
                      <span className="text-xs text-ink/30">.</span>
                      <span className="text-xs text-ink/50 font-inter">{chat.message_count} messages</span>
                    </div>
                  </div>
                  <div className="text-xs text-ink/40 font-inter">{formatDate(chat.created_at)}</div>
                  <ChevronRight className="h-5 w-5 text-ink/30" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
