import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { extractTextFromPDF } from '../lib/pdfExtractor';
import { generateDocumentSummary } from '../lib/gemini';
import {
  Upload as UploadIcon,
  FileText,
  CheckCircle,
  AlertCircle,
  Brain,
  Sparkles,
  Trash2,
  Eye,
  MessageSquare,
  X,
} from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
  status: 'uploading' | 'extracting' | 'analyzing' | 'ready' | 'error';
  progress?: number;
  error?: string;
  summary?: string;
  keyConcepts?: string[];
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const processFile = async (file: File) => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      alert('File size exceeds 10MB limit. Please upload a smaller PDF.');
      return;
    }

    const fileId = Date.now().toString();

    // Add file with uploading status
    setFiles(prev => [...prev, {
      id: fileId,
      name: file.name,
      size: file.size,
      uploadedAt: new Date(),
      status: 'uploading',
      progress: 0,
    }]);

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setFiles(prev => prev.map(f =>
        f.id === fileId ? { ...f, progress: i } : f
      ));
    }

    // Extracting phase
    setFiles(prev => prev.map(f =>
      f.id === fileId ? { ...f, status: 'extracting' } : f
    ));

    try {
      // Extract text from PDF
      const result = await extractTextFromPDF(file);

      if (!result.success || !result.text) {
        setFiles(prev => prev.map(f =>
          f.id === fileId ? { ...f, status: 'error', error: result.error } : f
        ));
        return;
      }

      // Store in Supabase
      const { data, error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user!.id,
          filename: file.name,
          extracted_text: result.text,
          file_size: file.size,
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      // Update file with real ID from database
      setFiles(prev => prev.map(f =>
        f.id === fileId ? { ...f, status: 'analyzing', id: data.id } : f
      ));

      // Generate Smart Analysis
      try {
        const analysis = await generateDocumentSummary(result.text);

        // Update database with summary and key concepts
        await supabase
          .from('documents')
          .update({
            summary: analysis.summary,
            key_concepts: analysis.keyConcepts,
          })
          .eq('id', data.id);

        setFiles(prev => prev.map(f =>
          f.id === data.id ? {
            ...f,
            status: 'ready',
            summary: analysis.summary,
            keyConcepts: analysis.keyConcepts,
          } : f
        ));
      } catch (analysisError) {
        console.error('Analysis failed:', analysisError);
        // Still mark as ready even if analysis fails
        setFiles(prev => prev.map(f =>
          f.id === data.id ? { ...f, status: 'ready' } : f
        ));
      }
    } catch (error) {
      console.error('Processing error:', error);
      setFiles(prev => prev.map(f =>
        f.id === fileId ? { ...f, status: 'error', error: 'Failed to process PDF. Please try again.' } : f
      ));
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const pdfFiles = droppedFiles.filter(f => f.type === 'application/pdf');

    if (pdfFiles.length === 0) {
      alert('Please upload PDF files only.');
      return;
    }

    pdfFiles.forEach(f => processFile(f));
  }, [user]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    const pdfFiles = selectedFiles.filter(f => f.type === 'application/pdf');

    if (pdfFiles.length === 0 && selectedFiles.length > 0) {
      alert('Please upload PDF files only.');
      return;
    }

    pdfFiles.forEach(f => processFile(f));
    e.target.value = '';
  };

  const removeFile = async (id: string) => {
    try {
      await supabase.from('documents').delete().eq('id', id);
      setFiles(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const askAboutDocument = (file: UploadedFile) => {
    navigate(`/chat?documentId=${file.id}&filename=${encodeURIComponent(file.name)}`);
  };

  const getStatusBadge = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return (
          <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full font-inter">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            Uploading...
          </span>
        );
      case 'extracting':
        return (
          <span className="flex items-center gap-1 text-xs text-sage bg-sage/10 px-2 py-1 rounded-full font-inter">
            <div className="w-2 h-2 rounded-full bg-sage animate-pulse"></div>
            Extracting text...
          </span>
        );
      case 'analyzing':
        return (
          <span className="flex items-center gap-1 text-xs text-accent bg-accent/10 px-2 py-1 rounded-full font-inter">
            <Sparkles className="w-3 h-3 animate-pulse" />
            Analyzing...
          </span>
        );
      case 'ready':
        return (
          <span className="flex items-center gap-1 text-xs text-sage bg-sage/10 px-2 py-1 rounded-full font-inter">
            <CheckCircle className="w-3 h-3" />
            Ready
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full font-inter">
            <AlertCircle className="w-3 h-3" />
            Error
          </span>
        );
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-fraunces text-2xl sm:text-3xl font-medium text-ink">Upload Notes</h1>
          <p className="text-ink/60 mt-1 font-inter">
            Upload your study materials and get AI-powered explanations
          </p>
        </div>

        {/* Upload Zone */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`relative mb-8 border-2 border-dashed rounded-2xl p-8 sm:p-12 transition-all ${
            isDragging
              ? 'border-accent bg-accent/5'
              : 'border-cream bg-white hover:border-accent/50 hover:bg-cream/30'
          }`}
        >
          <div className="text-center">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              isDragging ? 'bg-accent/10' : 'bg-cream'
            }`}>
              <UploadIcon className={`h-8 w-8 ${isDragging ? 'text-accent' : 'text-ink/40'}`} />
            </div>
            <h3 className="font-fraunces text-lg font-medium text-ink mb-2">
              {isDragging ? 'Drop your files here' : 'Drag & drop your PDF files'}
            </h3>
            <p className="text-ink/50 text-sm mb-4 font-inter">
              or click to browse from your device
            </p>
            <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-cream font-medium rounded-[8px] hover:bg-accent/90 cursor-pointer transition-colors font-inter">
              <UploadIcon className="h-4 w-4" />
              Browse Files
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
            <p className="text-xs text-ink/40 mt-4 font-inter">
              Supports PDF files up to 10MB
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-cream rounded-xl p-5 border-l-4 border-primary shadow-sm">
            <Brain className="h-6 w-6 text-primary mb-3" />
            <h4 className="font-fraunces font-medium text-ink mb-1">AI Analysis</h4>
            <p className="text-sm text-ink/60 font-inter">Get smart summaries and key concepts extracted from your notes</p>
          </div>
          <div className="bg-cream rounded-xl p-5 border-l-4 border-sage shadow-sm">
            <Sparkles className="h-6 w-6 text-sage mb-3" />
            <h4 className="font-fraunces font-medium text-ink mb-1">Smart Q&A</h4>
            <p className="text-sm text-ink/60 font-inter">Ask questions about your uploaded content in any language</p>
          </div>
          <div className="bg-cream rounded-xl p-5 border-l-4 border-accent shadow-sm">
            <FileText className="h-6 w-6 text-accent mb-3" />
            <h4 className="font-fraunces font-medium text-ink mb-1">Organized</h4>
            <p className="text-sm text-ink/60 font-inter">All your notes in one place, ready for quick reference</p>
          </div>
        </div>

        {/* Uploaded Files */}
        {files.length > 0 && (
          <div className="space-y-4">
            {files.map((file) => (
              <div key={file.id} className="bg-white rounded-xl border border-cream overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="px-6 py-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-ink truncate font-inter">{file.name}</h3>
                      {getStatusBadge(file.status)}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-ink/50 font-inter">{formatFileSize(file.size)}</span>
                      <span className="text-xs text-ink/30">|</span>
                      <span className="text-xs text-ink/50 font-inter">
                        {file.uploadedAt.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    {file.status === 'uploading' && file.progress !== undefined && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-cream rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-150"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {file.status === 'ready' && (
                      <button
                        onClick={() => askAboutDocument(file)}
                        className="flex items-center gap-1 px-3 py-2 bg-primary text-cream text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors font-inter"
                        title="Ask questions about this document"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Ask
                      </button>
                    )}
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-2 text-ink/40 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Smart Analysis Section */}
                {file.status === 'ready' && (file.summary || file.keyConcepts) && (
                  <div className="px-6 py-4 bg-cream/30 border-t border-cream">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-accent" />
                      <span className="text-xs font-medium text-accent font-inter">Smart Analysis</span>
                    </div>
                    {file.summary && (
                      <p className="text-sm text-ink/70 mb-3 font-inter">{file.summary}</p>
                    )}
                    {file.keyConcepts && file.keyConcepts.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {file.keyConcepts.map((concept, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-white text-ink/60 text-xs rounded-md border border-cream font-inter"
                          >
                            {concept}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Error Section */}
                {file.status === 'error' && file.error && (
                  <div className="px-6 py-3 bg-red-50 border-t border-red-100">
                    <p className="text-sm text-red-600 font-inter">{file.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {files.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-cream">
            <FileText className="h-12 w-12 text-ink/20 mx-auto mb-3" />
            <p className="text-ink/50 font-inter">No notes uploaded yet. Upload your first PDF to get started!</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
