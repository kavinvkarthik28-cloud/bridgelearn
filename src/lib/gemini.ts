const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

interface GeminiResponse {
  candidates?: {
    content: {
      parts: { text: string }[];
    };
  }[];
  error?: {
    message: string;
  };
}

const LANGUAGE_SYSTEM_PROMPTS: Record<string, string> = {
  english: 'You are BridgeLearn, an AI tutor for first-generation college students in India. Explain concepts simply using relatable Indian examples. Be encouraging and patient.',
  hindi: 'You are BridgeLearn, an AI tutor. Respond ONLY in Hindi language using Devanagari script. Explain concepts simply using relatable Indian examples. Be encouraging and patient.',
  tamil: 'You are BridgeLearn, an AI tutor. Respond ONLY in Tamil language using Tamil script. Explain concepts simply using relatable Indian examples like cricket, festivals, and daily life. Be encouraging and patient.',
  telugu: 'You are BridgeLearn, an AI tutor. Respond ONLY in Telugu language using Telugu script. Explain concepts simply using relatable Indian examples. Be encouraging and patient.',
};

export interface DocumentContext {
  filename: string;
  extractedText: string;
}

export async function generateAIResponse(
  message: string,
  language: string = 'english',
  conversationHistory: { role: 'user' | 'model'; content: string }[] = [],
  documentContext?: DocumentContext
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  let systemPrompt = LANGUAGE_SYSTEM_PROMPTS[language] || LANGUAGE_SYSTEM_PROMPTS.english;

  // Add document context if provided
  if (documentContext) {
    const documentSystemPrompt = `You are answering questions based on the following document content. Use ONLY this content to answer. If the answer isn't in the document, say so clearly and offer to answer generally instead.

DOCUMENT CONTENT:
${documentContext.extractedText}`;

    systemPrompt = `${documentSystemPrompt}\n\n${systemPrompt}`;
  }

  const contents = [
    ...conversationHistory.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    })),
    {
      role: 'user',
      parts: [{ text: message }],
    },
  ];

  const body = {
    contents,
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data: GeminiResponse = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No response generated');
  }

  return text;
}

export async function generateDocumentSummary(extractedText: string): Promise<{ summary: string; keyConcepts: string[] }> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const summaryPrompt = `Summarize this document in 2-3 sentences, then list 4-6 key concepts covered, as a bullet list. Keep it simple and student-friendly. Format your response exactly like this:

SUMMARY: [your summary here]

KEY CONCEPTS:
- [concept 1]
- [concept 2]
- [concept 3]
- [concept 4]
- [concept 5 if needed]
- [concept 6 if needed]

Document: ${extractedText.slice(0, 8000)}`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: summaryPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.5,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 512,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data: GeminiResponse = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No response generated');
  }

  // Parse the response
  const summaryMatch = text.match(/SUMMARY:\s*(.+?)(?=KEY CONCEPTS:|$)/s);
  const summary = summaryMatch ? summaryMatch[1].trim() : text.split('\n')[0];

  const conceptsMatch = text.match(/KEY CONCEPTS:\s*([\s\S]+)$/);
  let keyConcepts: string[] = [];
  if (conceptsMatch) {
    keyConcepts = conceptsMatch[1]
      .split('\n')
      .map(line => line.replace(/^[-\•]\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  return { summary, keyConcepts };
}
