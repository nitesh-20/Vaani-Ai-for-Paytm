import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({});
const sess = await ai.live.connect({model: 'm', callbacks: {}});
sess.sendRealtimeInput({ audio: { data: "AQ==", mimeType: 'audio/pcm;rate=16000'} });
