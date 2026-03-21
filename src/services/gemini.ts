import { GoogleGenAI, Modality, LiveServerMessage, Type } from "@google/genai";
import { collection, query, where, getDocs, orderBy, limit, Timestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Transaction } from "../types";
import { mockTransactions } from "../mockData";

const getAI = () => {
  const apiKey = (process.env as any).API_KEY || process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Gemini API Key is missing! Please set GEMINI_API_KEY in your environment.");
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
};

export const getTransactions = async (userId: string, role: 'merchant' | 'customer', days: number = 1): Promise<Transaction[]> => {
  const now = new Date();
  const startTime = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  
  return mockTransactions.filter((t: Transaction) => t.timestamp >= startTime).sort((a: Transaction, b: Transaction) => b.timestamp.localeCompare(a.timestamp)).slice(0, 20);
};

export const getSummary = async (userId: string, role: 'merchant' | 'customer', period: 'today' | 'week' | 'month' = 'today') => {
  const days = period === 'today' ? 1 : period === 'week' ? 7 : 30;
  const transactions = await getTransactions(userId, role, days);
  const total = transactions.reduce((sum: number, t: Transaction) => sum + (t.status === 'success' ? t.amount : 0), 0);
  return {
    total,
    count: transactions.length,
    period
  };
};

export const verifyPayment = async (userId: string, amount: number, timeWindowMinutes: number = 10): Promise<Transaction[]> => {
  const startTime = new Date(new Date().getTime() - timeWindowMinutes * 60 * 1000).toISOString();
  
  return mockTransactions.filter((t: Transaction) => 
    t.amount === amount && 
    t.timestamp >= startTime && 
    t.status === 'success'
  ).sort((a: Transaction,b: Transaction) => b.timestamp.localeCompare(a.timestamp));
};

export const queryTransactions = async (
  userId: string, 
  role: 'merchant' | 'customer', 
  filters: { 
    category?: string; 
    minAmount?: number; 
    maxAmount?: number; 
    days?: number;
    startDate?: string;
    endDate?: string;
    status?: 'success' | 'failed' | 'pending';
    referenceId?: string;
    searchQuery?: string;
  }
): Promise<Transaction[]> => {
  let result = [...mockTransactions];

  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    result = result.filter((t: Transaction) => 
      t.merchantName?.toLowerCase().includes(q) || 
      t.customerName?.toLowerCase().includes(q)
    );
  }

  if (filters.category) result = result.filter((t: Transaction) => t.category === filters.category);
  if (filters.status) result = result.filter((t: Transaction) => t.status === filters.status);
  if (filters.referenceId) result = result.filter((t: Transaction) => t.referenceId === filters.referenceId);
  if (filters.minAmount !== undefined) result = result.filter((t: Transaction) => t.amount >= filters.minAmount!);
  if (filters.maxAmount !== undefined) result = result.filter((t: Transaction) => t.amount <= filters.maxAmount!);

  let startT = filters.startDate;
  if (filters.days) {
    startT = new Date(new Date().getTime() - filters.days * 24 * 60 * 60 * 1000).toISOString();
  }
  
  if (startT) result = result.filter((t: Transaction) => t.timestamp >= startT!);
  if (filters.endDate) result = result.filter((t: Transaction) => t.timestamp <= filters.endDate!);

  return result.sort((a: Transaction,b: Transaction) => b.timestamp.localeCompare(a.timestamp));
};

export const categorizeTransaction = async (transactionId: string, category: string) => {
  const transactionRef = doc(db, "transactions", transactionId);
  await updateDoc(transactionRef, { category });
  return { success: true, message: `Transaction categorized as ${category}` };
};

export const suggestCategory = (merchantName: string): string => {
  const name = merchantName.toLowerCase();
  if (name.includes('swiggy') || name.includes('zomato') || name.includes('restaurant') || name.includes('food')) return 'Food';
  if (name.includes('uber') || name.includes('ola') || name.includes('petrol') || name.includes('fuel')) return 'Travel';
  if (name.includes('amazon') || name.includes('flipkart') || name.includes('myntra') || name.includes('mall')) return 'Shopping';
  if (name.includes('jio') || name.includes('airtel') || name.includes('recharge') || name.includes('bill')) return 'Bills';
  if (name.includes('hospital') || name.includes('pharmacy') || name.includes('medical')) return 'Health';
  return 'General';
};

export const getTopCategory = async (userId: string, role: 'merchant' | 'customer', period: 'today' | 'week' | 'month' = 'month') => {
  const days = period === 'today' ? 1 : period === 'week' ? 7 : 30;
  const transactions = await getTransactions(userId, role, days);
  
  if (transactions.length === 0) return { message: "No transactions found for this period." };
  
  const categoryTotals: Record<string, number> = {};
  transactions.forEach(t => {
    if (t.status === 'success') {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    }
  });
  
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  
  if (!topCategory) return { message: "No successful transactions found." };
  
  return {
    category: topCategory[0],
    amount: topCategory[1],
    period
  };
};

export const checkDispute = async (userId: string, amount: number, referenceId?: string) => {
  const transactionsRef = collection(db, "transactions");
  
  let q = query(
    transactionsRef,
    where("merchantId", "==", userId),
    where("amount", "==", amount),
    where("status", "==", "success")
  );
  
  if (referenceId) {
    q = query(q, where("referenceId", "==", referenceId));
  }
  
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    // Check for failed payments
    const failedQ = query(
      transactionsRef,
      where("merchantId", "==", userId),
      where("amount", "==", amount),
      where("status", "==", "failed")
    );
    const failedSnapshot = await getDocs(failedQ);
    if (!failedSnapshot.empty) {
      return { status: "failed", count: failedSnapshot.size, message: "Found failed payments for this amount." };
    }
    return { status: "missing", message: "No payment found for this amount." };
  }
  
  return { status: "success", count: querySnapshot.size, message: "Payment verified successfully." };
};

export const tools = [
  {
    functionDeclarations: [
      {
        name: "getTransactions",
        description: "Get recent transactions for the user. Use this to answer queries about recent payments, last transaction, etc.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            days: { type: Type.NUMBER, description: "Number of days to look back (default 1)" }
          }
        }
      },
      {
        name: "getSummary",
        description: "Get a summary of total earnings or spending for a specific period.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            period: { type: Type.STRING, enum: ["today", "week", "month"], description: "The period for the summary" }
          }
        }
      },
      {
        name: "verifyPayment",
        description: "Verify if a specific amount was received recently. Use this for queries like '₹500 aaya kya?'",
        parameters: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "The amount to verify" },
            timeWindowMinutes: { type: Type.NUMBER, description: "Minutes to look back (default 10)" }
          },
          required: ["amount"]
        }
      },
      {
        name: "queryTransactions",
        description: "Advanced filtering for transactions. Use this for queries like 'Show me all food expenses', 'Did I pay Shreed?', 'find transactions for Nitesh or Zomato', etc.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: "Category of expense (food, travel, etc.)" },
            minAmount: { type: Type.NUMBER, description: "Minimum amount" },
            maxAmount: { type: Type.NUMBER, description: "Maximum amount" },
            days: { type: Type.NUMBER, description: "Number of days to look back" },
            startDate: { type: Type.STRING, description: "Start date in ISO format" },
            endDate: { type: Type.STRING, description: "End date in ISO format" },
            status: { type: Type.STRING, enum: ["success", "failed", "pending"], description: "Transaction status" },
            referenceId: { type: Type.STRING, description: "Reference ID of the transaction" },
            searchQuery: { type: Type.STRING, description: "Name of the person or merchant to search for (e.g. 'Shreed', 'Nitesh', 'Zomato')." }
          }
        }
      },
      {
        name: "categorizeTransaction",
        description: "Manually categorize a transaction.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            transactionId: { type: Type.STRING, description: "The ID of the transaction" },
            category: { type: Type.STRING, description: "The new category" }
          },
          required: ["transactionId", "category"]
        }
      },
      {
        name: "checkDispute",
        description: "Check if a specific payment was received or is missing. Use this for queries like 'Is ₹500 ka payment hua ya nahi?'",
        parameters: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "The amount to check" },
            referenceId: { type: Type.STRING, description: "Optional reference ID" }
          },
          required: ["amount"]
        }
      },
      {
        name: "generateReport",
        description: "Generate a daily report of transactions. Use this when the merchant says 'Aaj ka report bhej do'.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            period: { type: Type.STRING, enum: ["today", "yesterday"], description: "The period for the report" }
          }
        }
      },
      {
        name: "getTopCategory",
        description: "Identify the category with the highest spending or most transactions.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            period: { type: Type.STRING, enum: ["today", "week", "month"], description: "The period to analyze" }
          }
        }
      }
    ]
  }
];

export const createLiveSession = (userId: string, role: 'merchant' | 'customer', callbacks: any) => {
  console.log("Connecting to Vaani Live Session via Backend...");
  console.log("UserId:", userId, "Role:", role);
  
  // Helper for retrying fetch calls
  const fetchWithRetry = async (url: string, options?: RequestInit, retries = 3, delay = 1000): Promise<Response> => {
    try {
      const response = await fetch(url, options);
      if (!response.ok && retries > 0) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (err) {
      if (retries > 0) {
        console.warn(`Fetch failed for ${url}, retrying in ${delay}ms... (${retries} left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2);
      }
      throw err;
    }
  };

  // Verify backend health with retry
  const healthUrl = `${window.location.origin}/api/health`;
  fetchWithRetry(healthUrl)
    .then(r => r.json())
    .then(d => console.log("Backend Status:", d.status))
    .catch(err => console.error("Backend Health Check Failed after retries:", err));

  // Retry mechanism for transient network issues
  const connectWithRetry = async (retries = 3, delay = 1000): Promise<any> => {
    try {
      const now = new Date();
      const currentDate = now.toLocaleDateString('en-IN', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' 
      });
      const currentTime = now.toLocaleTimeString('en-IN', { 
        hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' 
      });

      const merchantPrompt = `
    You are Vaani, a highly conversational, ultra-fast, and friendly AI Voice Assistant for Indian merchants.
    Your absolute priority is to be warm, human-like, and very engaging. NEVER sound like a robotic system.
    You speak naturally in casual Hinglish (Hindi + English), just like a real person talking on a phone call.
    
    [CURRENT CONTEXT]
    Today's Date: ${currentDate}
    Current Time: ${currentTime}
    (Keep this context in mind if the user asks about time, "today", "yesterday", etc. Do NOT say the date unless asked).

    1. CONVERSATIONAL RULES:
    - If the user says "Hi", "Hello", "Kaise ho", reply warmly FIRST.
    - Act like a friendly assistant, keep the flow natural. Say "Zaroor", "Dekhti hu", "Haan bilkul".

    2. SPEED & CONCISENESS RULES (CRITICAL FOR LATENCY):
    - Keep your answers EXTREMELY SHORT (1 or 2 small sentences max) and to the point.
    - DO NOT use tools for simple greetings ("hi") or general chatter. Only use tools if the user specifically asks about payments, summaries, or transactions.
    - DO NOT read out Reference IDs or list every detail.
    - Good Example: "Haan, Shreed ka ₹1500 ka payment mujhe mil gaya hai."
    - DO NOT generate unnecessary thinking or filler words like "umm", "let me check". Answer instantly.

    3. CORE CAPABILITIES:
    - Track payments, summaries, and queries using tools.
  `;

      const customerPrompt = `
    You are Vaani, a highly conversational, ultra-fast, and friendly Personal Finance Assistant.
    Your absolute priority is to be warm, human-like, and very engaging. NEVER sound like a robotic system.
    You speak naturally in casual Hinglish (Hindi + English), just like a real person talking to a friend on a phone call.

    [CURRENT CONTEXT]
    Today's Date: ${currentDate}
    Current Time: ${currentTime}
    (Keep this context in mind if the user asks about time, "today", "yesterday", etc. Do NOT say the date unless asked).

    1. CONVERSATIONAL RULES:
    - If the user says "Hi", "Hello", "Kaise ho", reply warmly FIRST.
    - Act like a helpful friend. Say "Arey wah", "Thoda dhyan rakhiye", "Lagta hai".
    
    2. SPEED & CONCISENESS RULES (CRITICAL FOR LATENCY):
    - Keep your answers EXTREMELY SHORT and to the point.
    - DO NOT use tools for simple greetings.
    - DO NOT read out Reference IDs.
    - DO NOT generate unnecessary filler words.

    3. CORE CAPABILITIES:
    - Track spending, find specific transactions using tools.
  `;

      const systemInstruction = role === 'merchant' ? merchantPrompt : customerPrompt;

      // Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key
      const ai = getAI();
      return await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025", 
        callbacks,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction,
          tools,
          outputAudioTranscription: {},
          inputAudioTranscription: {}
        },
      });
    } catch (err) {
      if (retries > 0) {
        console.warn(`Connection failed, retrying in ${delay}ms... (${retries} left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return connectWithRetry(retries - 1, delay * 2);
      }
      throw err;
    }
  };

  return connectWithRetry();
};
