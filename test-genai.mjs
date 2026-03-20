import { GoogleGenAI } from '@google/genai';
const genai = new GoogleGenAI({ apiKey: 'fake' });
genai.live.connect({ model: "gemini-2.0-flash-exp" }).then(s => {
    console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(s)));
}).catch(e => {
    console.log("Error constructor");
});
