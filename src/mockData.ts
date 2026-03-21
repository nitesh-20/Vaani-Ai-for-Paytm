import { Transaction } from "./types";

const daysAgo = (days: number) => {
  const d = new Date();
  d.setTime(d.getTime() - days * 24 * 60 * 60 * 1000);
  return d.toISOString();
};

export const mockTransactions: Transaction[] = [
  {
    id: "t1", amount: 450, currency: "INR", timestamp: daysAgo(0.1),
    merchantId: "M_ZOMATO", customerId: "u1", customerName: "User",
    merchantName: "Zomato", category: "Food & Grocery", status: "success",
    type: "Paid", referenceId: "TXN_ZOM_1", payment_method: "UPI"
  },
  {
    id: "t2", amount: 15000, currency: "INR", timestamp: daysAgo(0.5),
    merchantId: "M_RAHUL", customerId: "u1", customerName: "User",
    merchantName: "Rahul Sharma", category: "Transfer", status: "success",
    type: "Received", referenceId: "TXN_RCV_1", payment_method: "UPI"
  },
  {
    id: "t3", amount: 1250, currency: "INR", timestamp: daysAgo(1),
    merchantId: "M_JIO", customerId: "u1", customerName: "User",
    merchantName: "Jio Pre-Paid", category: "Recharges & Bill Payments", status: "success",
    type: "Paid", referenceId: "TXN_JIO_1", payment_method: "Credit Card"
  },
  {
    id: "t4", amount: 699, currency: "INR", timestamp: daysAgo(1.5),
    merchantId: "M_AMAZON", customerId: "u1", customerName: "User",
    merchantName: "Amazon India", category: "Shopping", status: "success",
    type: "Paid", referenceId: "TXN_AMZN_1", payment_method: "Credit Card"
  },
  {
    id: "t5", amount: 50, currency: "INR", timestamp: daysAgo(2),
    merchantId: "M_PAYTM", customerId: "u1", customerName: "User",
    merchantName: "Paytm Cashback", category: "Cashback", status: "success",
    type: "Cashback", referenceId: "TXN_CB_1", payment_method: "Wallet"
  },
  {
    id: "t6", amount: 4500, currency: "INR", timestamp: daysAgo(3),
    merchantId: "M_MAKEMYTRIP", customerId: "u1", customerName: "User",
    merchantName: "MakeMyTrip", category: "Travel", status: "failed",
    type: "Paid", referenceId: "TXN_MMT_1", payment_method: "UPI",
    failure_reason: "Bank Server Down"
  },
  {
    id: "t7", amount: 800, currency: "INR", timestamp: daysAgo(4),
    merchantId: "M_BOOKMYSHOW", customerId: "u1", customerName: "User",
    merchantName: "BookMyShow", category: "Movies & Events", status: "success",
    type: "Paid", referenceId: "TXN_BMS_1", payment_method: "UPI"
  },
  {
    id: "t8", amount: 2400, currency: "INR", timestamp: daysAgo(5),
    merchantId: "M_DMART", customerId: "u1", customerName: "User",
    merchantName: "D-Mart", category: "Food & Grocery", status: "success",
    type: "Paid", referenceId: "TXN_DMT_1", payment_method: "Credit Card"
  },
  {
    id: "t9", amount: 3000, currency: "INR", timestamp: daysAgo(6),
    merchantId: "M_PRIYA", customerId: "u1", customerName: "User",
    merchantName: "Priya Singh", category: "Transfer", status: "success",
    type: "Received", referenceId: "TXN_RCV_2", payment_method: "UPI"
  },
  {
    id: "t10", amount: 1540, currency: "INR", timestamp: daysAgo(7),
    merchantId: "M_UBER", customerId: "u1", customerName: "User",
    merchantName: "Uber", category: "Travel", status: "success",
    type: "Paid", referenceId: "TXN_UB_1", payment_method: "UPI"
  },
  {
    id: "t11", amount: 1000, currency: "INR", timestamp: daysAgo(8),
    merchantId: "M_AMIT", customerId: "u1", customerName: "User",
    merchantName: "Amit Kumar", category: "Transfer", status: "pending",
    type: "Paid", referenceId: "TXN_TR_1", payment_method: "UPI"
  },
  {
    id: "t12", amount: 12000, currency: "INR", timestamp: daysAgo(10),
    merchantId: "M_LIC", customerId: "u1", customerName: "User",
    merchantName: "LIC Premium", category: "Insurance", status: "success",
    type: "Paid", referenceId: "TXN_LIC_1", payment_method: "Net Banking"
  },
  {
    id: "t13", amount: 299, currency: "INR", timestamp: daysAgo(12),
    merchantId: "M_SWIGGY", customerId: "u1", customerName: "User",
    merchantName: "Swiggy", category: "Food & Grocery", status: "success",
    type: "Paid", referenceId: "TXN_SW_1", payment_method: "UPI"
  },
  {
    id: "t14", amount: 5000, currency: "INR", timestamp: daysAgo(14),
    merchantId: "M_GOLD", customerId: "u1", customerName: "User",
    merchantName: "Paytm Gold", category: "Paytm Gold", status: "success",
    type: "Paid", referenceId: "TXN_PG_1", payment_method: "Debit Card"
  },
  {
    id: "t15", amount: 850, currency: "INR", timestamp: daysAgo(15),
    merchantId: "M_VIKRAM", customerId: "u1", customerName: "User",
    merchantName: "Vikram Patel", category: "Transfer", status: "success",
    type: "Received", referenceId: "TXN_RCV_3", payment_method: "UPI"
  }
];