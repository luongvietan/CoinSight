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
  setDoc,
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
    throw error;
  }
};

export const getUserTransactions = async (userId: string, limitCount = 50) => {
  try {
    // Thực hiện truy vấn với composite index
    // Lưu ý: Nếu gặp lỗi index, hãy truy cập đường link trong thông báo lỗi để tạo index
    // hoặc vào Firebase Console -> Firestore Database -> Indexes -> Add Index:
    // Collection: transactions
    // Fields để index: userId Ascending, date Descending
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
    } catch (indexError) {
      // Phương pháp thay thế không sử dụng orderBy để tránh lỗi index
      // Lưu ý: Transactions sẽ không được sắp xếp theo thời gian
      const q = query(
        collection(db, "transactions"),
        where("userId", "==", userId),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const transactions: Transaction[] = [];

      querySnapshot.forEach((doc) => {
        transactions.push({ id: doc.id, ...doc.data() } as Transaction);
      });

      // Sắp xếp thủ công dựa trên trường date
      return transactions.sort((a, b) => {
        const dateA = a.date
          ? (a.date as any).toDate?.() || new Date(a.date)
          : new Date(0);
        const dateB = b.date
          ? (b.date as any).toDate?.() || new Date(b.date)
          : new Date(0);
        return dateB.getTime() - dateA.getTime(); // Sắp xếp giảm dần (mới nhất trước)
      });
    }
  } catch (error) {
    // Tạm thời trả về mảng rỗng để tránh crash ứng dụng
    return [];
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
    throw error;
  }
};

export const deleteTransaction = async (id: string) => {
  try {
    const docRef = doc(db, "transactions", id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    throw error;
  }
};

// Budgets
export const addBudget = async (budget: Omit<Budget, "id">) => {
  try {
    const docRef = await addDoc(collection(db, "budgets"), budget);
    return { id: docRef.id, ...budget };
  } catch (error) {
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
    throw error;
  }
};

export const updateBudget = async (id: string, data: Partial<Budget>) => {
  try {
    const docRef = doc(db, "budgets", id);
    await updateDoc(docRef, data);
    return { id, ...data };
  } catch (error) {
    throw error;
  }
};

export const deleteBudget = async (id: string) => {
  try {
    const docRef = doc(db, "budgets", id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
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
    throw error;
  }
};

export const updateUser = async (userId: string, data: Partial<User>) => {
  try {
    const docRef = doc(db, "users", userId);

    // Kiểm tra xem document đã tồn tại chưa
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Nếu đã tồn tại, cập nhật
      await updateDoc(docRef, data);
    } else {
      // Nếu chưa tồn tại, tạo mới với dữ liệu mặc định
      const defaultUserData: User = {
        email: data.email || "",
        displayName: data.displayName || "User",
        photoURL: data.photoURL || "",
        isPremium: false,
        currency: "VND",
        monthlyBudget: data.monthlyBudget || 0,
        categories: ["food", "shopping", "bills", "entertainment", "other"],
      };

      // Merge dữ liệu mặc định với dữ liệu được cung cấp
      await setDoc(docRef, { ...defaultUserData, ...data });
    }

    return { id: userId, ...data };
  } catch (error) {
    throw error;
  }
};
