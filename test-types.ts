import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({});
const sess = await ai.live.connect({model: 'gemini-2.0-flash-exp'});
sess.sendRealtimeInput({ mediaChunks: [{ data: "AQ==", mimeType: 'audio/pcm;rate=16000'}] });
sess.sendRealtimeInput([{ data: "AQ==", mimeType: 'audio/pcm;rate=16000'}]);
sess.sendRealtimeInput({ mediaChunks: [] });
