import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";

// Interfaces
export interface Transaction {
  id?: string;
  userId: string;
  amount: number;
  description: string;
  category: string;
  date: Timestamp;
  isRecurring: boolean;
  recurringId?: string;
}

export interface Budget {
  id?: string;
  userId: string;
  category: string;
  limit: number;
  period: "weekly" | "monthly";
}

export interface User {
  id?: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isPremium: boolean;
  premiumSince?: Timestamp;
  currency: string;
  monthlyBudget: number;
  categories: string[];
}

// Transactions
export const addTransaction = async (transaction: Omit<Transaction, "id">) => {
  try {
    const docRef = await addDoc(collection(db, "transactions"), {
      ...transaction,
      date: transaction.date || serverTimestamp(),
    });
    return { id: docRef.id, ...transaction };
  } catch (error) {
    console.error("Lỗi thêm giao dịch:", error);
    throw error;
  }
};

export const getTransaction = async (id: string) => {
  try {
    const docRef = doc(db, "transactions", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Transaction;
    } else {
      throw new Error("Không tìm thấy giao dịch");
    }
  } catch (error) {
    console.error("Lỗi lấy giao dịch:", error);
    throw error;
  }
};

export const getUserTransactions = async (userId: string, limitCount = 50) => {
  try {
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", userId),
      orderBy("date", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];

    querySnapshot.forEach((doc) => {
      transactions.push({ id: doc.id, ...doc.data() } as Transaction);
    });

    return transactions;
  } catch (error) {
    console.error("Lỗi lấy danh sách giao dịch:", error);
    throw error;
  }
};

export const updateTransaction = async (
  id: string,
  data: Partial<Transaction>
) => {
  try {
    const docRef = doc(db, "transactions", id);
    await updateDoc(docRef, data);
    return { id, ...data };
  } catch (error) {
    console.error("Lỗi cập nhật giao dịch:", error);
    throw error;
  }
};

export const deleteTransaction = async (id: string) => {
  try {
    const docRef = doc(db, "transactions", id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Lỗi xóa giao dịch:", error);
    throw error;
  }
};

// Budgets
export const addBudget = async (budget: Omit<Budget, "id">) => {
  try {
    const docRef = await addDoc(collection(db, "budgets"), budget);
    return { id: docRef.id, ...budget };
  } catch (error) {
    console.error("Lỗi thêm ngân sách:", error);
    throw error;
  }
};

export const getUserBudgets = async (userId: string) => {
  try {
    const q = query(collection(db, "budgets"), where("userId", "==", userId));

    const querySnapshot = await getDocs(q);
    const budgets: Budget[] = [];

    querySnapshot.forEach((doc) => {
      budgets.push({ id: doc.id, ...doc.data() } as Budget);
    });

    return budgets;
  } catch (error) {
    console.error("Lỗi lấy danh sách ngân sách:", error);
    throw error;
  }
};

export const updateBudget = async (id: string, data: Partial<Budget>) => {
  try {
    const docRef = doc(db, "budgets", id);
    await updateDoc(docRef, data);
    return { id, ...data };
  } catch (error) {
    console.error("Lỗi cập nhật ngân sách:", error);
    throw error;
  }
};

export const deleteBudget = async (id: string) => {
  try {
    const docRef = doc(db, "budgets", id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Lỗi xóa ngân sách:", error);
    throw error;
  }
};

// User
export const getUser = async (userId: string) => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as User;
    } else {
      throw new Error("Không tìm thấy người dùng");
    }
  } catch (error) {
    console.error("Lỗi lấy thông tin người dùng:", error);
    throw error;
  }
};

export const updateUser = async (userId: string, data: Partial<User>) => {
  try {
    const docRef = doc(db, "users", userId);
    await updateDoc(docRef, data);
    return { id: userId, ...data };
  } catch (error) {
    console.error("Lỗi cập nhật thông tin người dùng:", error);
    throw error;
  }
};
