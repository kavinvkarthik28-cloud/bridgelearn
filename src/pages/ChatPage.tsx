import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { generateAIResponse, DocumentContext } from '../lib/gemini';
import { supabase } from '../lib/supabase';
import {
  Send,
  GraduationCap,
  User,
  RotateCcw,
  Lightbulb,
  AlertCircle,
  X,
  FileText,
} from 'lucide-react';

type Language = 'english' | 'hindi' | 'tamil' | 'telugu';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  language: Language;
  error?: boolean;
}

interface LanguageOption {
  value: Language;
  label: string;
  initials: string;
}

interface DocumentData {
  id: string;
  filename: string;
  extracted_text: string;
}

const LANGUAGES: LanguageOption[] = [
  { value: 'english', label: 'English', initials: 'EN' },
  { value: 'hindi', label: 'Hindi', initials: 'HI' },
  { value: 'tamil', label: 'Tamil', initials: 'TA' },
  { value: 'telugu', label: 'Telugu', initials: 'TE' },
];

const WELCOME_MESSAGES: Record<Language, string> = {
  english: "Hello! I'm your AI study partner. How can I help you today? I can explain concepts, answer questions, or help you understand your notes.",
  hindi: "नमस्ते! मैं आपका AI अध्ययन साथी हूं। मैं आज आपकी कैसे मदद कर सकता हूं?",
  tamil: "வணக்கம்! நான் உங்கள் AI படிப்பு துணை. நான் இன்று உங்களுக்கு எப்படி உதவ முடியும்?",
  telugu: "నమస్కారం! నేను మీ AI చదువుల సహాయకుడిని. ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?",
};

const DOCUMENT_MODE_MESSAGES: Record<Language, string> = {
  english: "I'm now answering questions based on your document. Ask me anything about its content!",
  hindi: "मैं अब आपके दस्तावेज़ के आधार पर प्रश्नों का उत्तर दे रहा हूं। इसकी सामग्री के बारे में कुछ भी पूछें!",
  tamil: "நான் இப்போது உங்கள் ஆவணத்தின் அடிப்படையில் கேள்விகளுக்கு பதிலளிக்கிறேன். அதன் உள்ளடக்கத்தைப் பற்றி எதையும் கேளுங்கள்!",
  telugu: "నేను ఇప్పుడు మీ పత్రం ఆధారంగా ప్రశ్నలకు సమాధానాలు ఇస్తున్నాను. దాని విషయం గురించి ఏదైనా అడగండి!",
};

export function ChatPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<Language>('english');
  const [isTyping, setIsTyping] = useState(false);
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const documentId = searchParams.get('documentId');
  const filename = searchParams.get('filename');

  // Load document if documentId is provided
  useEffect(() => {
    if (documentId && user) {
      loadDocument(documentId);
    }
  }, [documentId, user]);

  const loadDocument = async (id: string) => {
    setLoadingDocument(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, filename, extracted_text')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setDocument(data);
        // Set welcome message for document mode
        setMessages([{
          id: Date.now().toString(),
          role: 'assistant',
          content: DOCUMENT_MODE_MESSAGES[language],
          timestamp: new Date(),
          language,
        }]);
      }
    } catch (error) {
      console.error('Error loading document:', error);
    } finally {
      setLoadingDocument(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Only reset on language change if not in document mode
  useEffect(() => {
    if (!document) {
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: WELCOME_MESSAGES[language],
        timestamp: new Date(),
        language,
      }]);
    }
  }, [language, document]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getCurrentLanguage = () => LANGUAGES.find(l => l.value === language);

  const exitDocumentMode = () => {
    setDocument(null);
    setSearchParams({});
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: WELCOME_MESSAGES[language],
      timestamp: new Date(),
      language,
    }]);
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      language,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const conversationHistory = messages
        .slice(-10)
        .filter(m => !m.error)
        .map(m => ({
          role: m.role === 'user' ? 'user' as const : 'model' as const,
          content: m.content,
        }));

      // Prepare document context if in document mode
      let documentContext: DocumentContext | undefined;
      if (document) {
        documentContext = {
          filename: document.filename,
          extractedText: document.extracted_text,
        };
      }

      const aiResponse = await generateAIResponse(
        input.trim(),
        language,
        conversationHistory,
        documentContext
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        language,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error
          ? `Sorry, I encountered an error: ${error.message}. Please try again.`
          : 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
        language,
        error: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    if (document) {
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: DOCUMENT_MODE_MESSAGES[language],
        timestamp: new Date(),
        language,
      }]);
    } else {
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: WELCOME_MESSAGES[language],
        timestamp: new Date(),
        language,
      }]);
    }
  };

  const suggestions = document
    ? [
        "What is this document about?",
        "Summarize the main points",
        "What are the key concepts?",
        "Explain the most important topic",
      ]
    : [
        "Explain gravitational force",
        "Help me understand calculus",
        "What is photosynthesis?",
        "Solve this equation: x^2 + 5x + 6 = 0",
      ];

  return (
    <Layout>
      <div className="min-h-screen flex flex-col bg-cream">
        {/* Chat Header */}
        <div className="bg-white border-b border-cream/50 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-fraunces font-medium text-ink">AI Study Partner</h1>
                <p className="text-xs text-ink/50 font-inter">Powered by Gemini</p>
              </div>
            </div>

            {/* Language Selector - Notebook Tab Pills */}
            <div className="flex items-center gap-1 bg-cream/80 rounded-lg p-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => setLanguage(lang.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    language === lang.value
                      ? 'bg-primary text-cream shadow-sm'
                      : 'text-ink/60 hover:text-ink hover:bg-white/50'
                  }`}
                  title={lang.label}
                >
                  {lang.initials}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Document Mode Banner */}
        {(document || loadingDocument) && (
          <div className="bg-accent/10 border-b border-accent/20 px-4 py-2">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-accent font-inter">
                  {loadingDocument ? 'Loading document...' : `Answering from: ${filename || document?.filename}`}
                </span>
              </div>
              <button
                onClick={exitDocumentMode}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-accent hover:bg-accent/20 rounded transition-colors font-inter"
              >
                <X className="h-3 w-3" />
                Exit document mode
              </button>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      {message.error ? (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <GraduationCap className="h-4 w-4 text-accent" />
                      )}
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.error
                        ? 'bg-red-50 border border-red-200 text-red-900'
                        : message.role === 'user'
                        ? 'bg-primary text-cream'
                        : 'bg-white border border-cream text-ink shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed font-inter">{message.content}</p>
                    <p className={`text-xs mt-2 font-inter ${
                      message.error ? 'text-red-500' :
                      message.role === 'user' ? 'text-cream/60' : 'text-ink/40'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="h-4 w-4 text-accent" />
                  </div>
                  <div className="bg-white border border-cream shadow-sm rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && !isTyping && (
          <div className="max-w-4xl mx-auto px-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-sage" />
              <span className="text-sm text-ink/60 font-inter">Try asking:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-2 bg-white border border-cream rounded-lg text-sm text-ink/70 hover:bg-cream hover:border-accent/30 transition-colors font-inter shadow-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-white border-t border-cream/50 px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-3">
              <button
                onClick={clearChat}
                className="p-2 text-ink/40 hover:text-ink/60 transition-colors"
                title="Clear chat"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={document
                    ? `Ask about ${document.filename}...`
                    : `Type your question in ${getCurrentLanguage()?.label}...`
                  }
                  rows={1}
                  className="w-full px-4 py-3 border border-cream bg-cream/30 rounded-xl resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 outline-none transition-all font-inter"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="p-3 bg-accent text-cream rounded-xl hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-ink/40 mt-2 text-center font-inter">
              {document
                ? 'Answering from your document. Ask questions about its content!'
                : 'BridgeLearn AI provides educational assistance. Always verify important information.'
              }
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
