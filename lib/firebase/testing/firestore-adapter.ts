// Firestore adapter dành cho testing
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
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./testing-firebase-config";

// Kiểm tra xem có sử dụng mock data hay không
const useMockData = process.env.USE_MOCK_DATA === "true";

// Log trạng thái adapter
console.log(
  `Firestore adapter: ${
    useMockData ? "Sử dụng mock data" : "Sử dụng Firestore thật"
  }`
);

// Mock data cho testing
const mockTransactions = [
  {
    id: "mock-tx-1",
    userId: "mock-user-id",
    amount: 50000,
    description: "Cà phê sáng",
    category: "food",
    date: new Date(),
    isRecurring: false,
  },
  {
    id: "mock-tx-2",
    userId: "mock-user-id",
    amount: 300000,
    description: "Mua sắm cuối tuần",
    category: "shopping",
    date: new Date(),
    isRecurring: false,
  },
];

// Interface cho Transaction
export interface Transaction {
  id?: string;
  userId: string;
  amount: number;
  description: string;
  category: string;
  date: Date | Timestamp;
  isRecurring: boolean;
  recurringId?: string;
}

// Thêm giao dịch
export const addTransaction = async (transaction: Omit<Transaction, "id">) => {
  if (useMockData) {
    const mockTx = {
      id: `mock-tx-${Date.now()}`,
      ...transaction,
      date: transaction.date || new Date(),
    };
    mockTransactions.push(mockTx);
    return mockTx;
  }

  try {
    console.log(`Thêm giao dịch mới cho user ${transaction.userId}`);
    const txData = {
      ...transaction,
      date:
        transaction.date instanceof Date
          ? Timestamp.fromDate(transaction.date)
          : transaction.date || serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "transactions"), txData);
    console.log(`Đã thêm giao dịch với ID: ${docRef.id}`);
    return { id: docRef.id, ...transaction };
  } catch (error) {
    console.error("Lỗi thêm giao dịch:", error);
    throw error;
  }
};

// Lấy thông tin giao dịch
export const getTransaction = async (id: string) => {
  if (useMockData) {
    const tx = mockTransactions.find((t) => t.id === id);
    if (tx) return tx;
    throw new Error("Không tìm thấy giao dịch");
  }

  try {
    console.log(`Lấy thông tin giao dịch: ${id}`);
    const docRef = doc(db, "transactions", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Chuyển Timestamp về Date cho dễ xử lý
      const date =
        data.date instanceof Timestamp
          ? data.date.toDate()
          : new Date(data.date);

      return {
        id: docSnap.id,
        ...data,
        date,
      } as Transaction;
    } else {
      throw new Error("Không tìm thấy giao dịch");
    }
  } catch (error) {
    console.error("Lỗi lấy giao dịch:", error);
    throw error;
  }
};

// Lấy danh sách giao dịch theo userId
export const getUserTransactions = async (userId: string, limitCount = 50) => {
  if (useMockData) {
    return mockTransactions
      .filter((t) => t.userId === userId)
      .slice(0, limitCount);
  }

  try {
    console.log(`Lấy danh sách giao dịch cho user: ${userId}`);
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", userId),
      orderBy("date", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Chuyển Timestamp về Date
      const date =
        data.date instanceof Timestamp
          ? data.date.toDate()
          : new Date(data.date);

      transactions.push({
        id: doc.id,
        ...data,
        date,
      } as Transaction);
    });

    return transactions;
  } catch (error) {
    console.error("Lỗi lấy danh sách giao dịch:", error);
    throw error;
  }
};

// Cập nhật giao dịch
export const updateTransaction = async (
  id: string,
  data: Partial<Transaction>
) => {
  if (useMockData) {
    const index = mockTransactions.findIndex((t) => t.id === id);
    if (index !== -1) {
      mockTransactions[index] = { ...mockTransactions[index], ...data };
      return { id, ...mockTransactions[index] };
    }
    throw new Error("Không tìm thấy giao dịch để cập nhật");
  }

  try {
    console.log(`Cập nhật giao dịch: ${id}`);
    const updateData: DocumentData = { ...data };

    // Chuyển Date thành Timestamp nếu cần
    if (data.date && data.date instanceof Date) {
      updateData.date = Timestamp.fromDate(data.date);
    }

    const docRef = doc(db, "transactions", id);
    await updateDoc(docRef, updateData);
    return { id, ...data };
  } catch (error) {
    console.error("Lỗi cập nhật giao dịch:", error);
    throw error;
  }
};

// Xóa giao dịch
export const deleteTransaction = async (id: string) => {
  if (useMockData) {
    const index = mockTransactions.findIndex((t) => t.id === id);
    if (index !== -1) {
      mockTransactions.splice(index, 1);
      return true;
    }
    throw new Error("Không tìm thấy giao dịch để xóa");
  }

  try {
    console.log(`Xóa giao dịch: ${id}`);
    const docRef = doc(db, "transactions", id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Lỗi xóa giao dịch:", error);
    throw error;
  }
};
