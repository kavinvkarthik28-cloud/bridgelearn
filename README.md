# BridgeLearn

An AI-powered study partner for first-generation college students in India. BridgeLearn provides personalized tutoring in multiple Indian languages.

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-tgf7tzqs)

## Features

- **Multi-Language Support**: Learn in Tamil, Hindi, Telugu, or English
- **AI-Powered Tutoring**: Get instant answers powered by Google Gemini
- **Smart Note Analysis**: Upload PDF notes and get AI-generated summaries and key concepts
- **Document Q&A**: Ask questions about your uploaded documents with context-aware answers
- **Progress Tracking**: Monitor your learning journey with dashboard statistics

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS with custom color palette
- **Backend**: Supabase (PostgreSQL with Row Level Security)
- **AI**: Google Gemini API
- **PDF Processing**: pdf.js for text extraction

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Google Gemini API key

### Environment Variables

Create a `.env` file with:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Installation

```bash
npm install
npm run dev
```

## Project Structure

- `src/pages/` - Main page components (Landing, Auth, Dashboard, Chat, Upload)
- `src/components/` - Reusable UI components (Layout, Navbar, ProtectedRoute)
- `src/lib/` - Utility libraries (supabase client, gemini AI, PDF extraction)
- `src/contexts/` - React contexts (AuthContext)

## License

MIT
