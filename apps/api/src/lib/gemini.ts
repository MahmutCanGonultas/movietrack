import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const V1_OPTIONS = { apiVersion: 'v1beta' } as const;

export async function embedText(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' }, V1_OPTIONS);
  const result = await model.embedContent(text);
  return result.embedding.values;
}

export async function generateText(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }, V1_OPTIONS);
  const result = await model.generateContent(prompt);
  return result.response.text();
}
