import { collection, addDoc, writeBatch, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Transaction } from "../types";
import { suggestCategory } from "./gemini";

export const seedOneMonthData = async (userId: string, role: 'merchant' | 'customer', userName: string) => {
  const batch = writeBatch(db);
  const transactions: Transaction[] = [];
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const merchants = ["Chai Point", "Sharma General Store", "Big Basket", "Uber", "Zomato", "Amazon", "Swiggy", "Reliance Fresh", "Apollo Pharmacy", "Petrol Pump"];
  const customers = ["Aman", "Rohit", "Sneha", "Priya", "Vikram", "Karan", "Anjali", "Siddharth", "Megha", "Rahul"];
  const categories = ["food", "travel", "shopping", "bills", "groceries", "health", "entertainment"];
  
  const isMerchant = role === 'merchant';
  
  
  // Generate structured dates to make sure we have data for today, yesterday, last week, etc.
  for (let i = 0; i < 50; i++) {
    // Heavily weight towards recent days (0-5 days)
    const daysAgo = i < 20 ? (Math.random() * 2) : (Math.random() * 30); 
    const randomTime = now.getTime() - daysAgo * 24 * 60 * 60 * 1000;
    const timestamp = new Date(randomTime).toISOString();
    
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    
    const tx: Transaction = {
      amount: Math.floor(Math.random() * 5000) + 10,
      currency: "INR",
      timestamp,
      merchantId: isMerchant ? userId : "dummy_merchant_" + Math.floor(Math.random() * 10),
      customerId: isMerchant ? "dummy_customer_" + Math.floor(Math.random() * 10) : userId,
      merchantName: isMerchant ? userName : merchant,
      customerName: isMerchant ? customer : userName,
      category: suggestCategory(isMerchant ? userName : merchant),
      status: Math.random() > 0.1 ? "success" : "failed",
      referenceId: "TXN" + Math.random().toString(36).substring(2, 10).toUpperCase(),
      description: `Payment at ${isMerchant ? userName : merchant}`
    };
    
    const docRef = doc(collection(db, 'transactions'));
    batch.set(docRef, tx);
  }
  
  await batch.commit();
  console.log("Successfully seeded dynamic demo transactions.");

};
