import { httpsCallable } from "firebase/functions";
import { functions } from "./config";

// Interface cho dữ liệu thanh toán
export interface StripeCheckoutData {
  priceId: string;
  customerEmail: string;
}

// Interface cho kết quả phiên thanh toán
export interface StripeCheckoutResult {
  sessionId: string;
}

// Tạo phiên thanh toán Stripe
export const createStripeCheckoutSession = async (data: StripeCheckoutData) => {
  try {
    const createCheckoutSession = httpsCallable<
      StripeCheckoutData,
      StripeCheckoutResult
    >(functions, "createStripeSubscription");

    const result = await createCheckoutSession(data);
    return result.data;
  } catch (error) {
    // console.error("Lỗi tạo phiên thanh toán Stripe:", error);
    throw error;
  }
};

// Interface cho việc phân loại giao dịch
export interface ClassifyTransactionData {
  description: string;
  userId: string;
}

// Interface cho kết quả phân loại
export interface ClassifyTransactionResult {
  category: string;
}

// Phân loại giao dịch bằng OpenAI
export const classifyTransaction = async (data: ClassifyTransactionData) => {
  try {
    const classifyFunc = httpsCallable<
      ClassifyTransactionData,
      ClassifyTransactionResult
    >(functions, "classifyTransaction");

    const result = await classifyFunc(data);
    return result.data;
  } catch (error) {
    // console.error("Lỗi phân loại giao dịch:", error);
    throw error;
  }
};
