import type { Transaction } from "@/types/transaction";
import type { Budget } from "@/types/budget";
import type { Goal } from "@/types/goal";
import type { RecurringTransaction } from "@/types/recurring-transaction";
import { auth } from "@/lib/firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// Fetch transactions from Firestore
export async function fetchTransactions(): Promise<Transaction[]> {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn("Người dùng chưa đăng nhập");
      return []; // Trả về mảng rỗng thay vì ném lỗi
    }

    // Đơn giản hóa truy vấn để tránh vấn đề về chỉ mục
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid)
      // Bỏ orderBy để tránh lỗi chỉ mục composite
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
      const formattedDate = date.toISOString().split("T")[0]; // Format YYYY-MM-DD

      transactions.push({
        id: doc.id,
        description: data.description,
        amount: data.amount,
        category: data.category,
        date: formattedDate,
      });
    });

    // Sắp xếp phía client thay vì trên Firestore
    return transactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    console.error("Lỗi khi lấy giao dịch:", error);
    return []; // Trả về mảng rỗng thay vì ném lỗi
  }
}

// Add a new transaction
export async function addTransaction(
  transaction: Omit<Transaction, "id">
): Promise<Transaction> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Người dùng chưa đăng nhập");
    }

    const transactionData = {
      userId: user.uid,
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category,
      date: Timestamp.fromDate(new Date(transaction.date)),
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, "transactions"),
      transactionData
    );

    // Trả về đối tượng giao dịch hoàn chỉnh với ID mới
    return {
      id: docRef.id,
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category,
      date: transaction.date,
    };
  } catch (error) {
    console.error("Lỗi khi thêm giao dịch:", error);
    throw error;
  }
}

// Update a transaction
export async function updateTransaction(
  id: string,
  transaction: Partial<Transaction>
): Promise<Transaction> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Người dùng chưa đăng nhập");
    }

    const transactionRef = doc(db, "transactions", id);
    const transactionSnapshot = await getDoc(transactionRef);

    if (!transactionSnapshot.exists()) {
      throw new Error("Giao dịch không tồn tại");
    }

    const currentData = transactionSnapshot.data();
    if (currentData.userId !== user.uid) {
      throw new Error("Không có quyền cập nhật giao dịch này");
    }

    const updateData: any = {};
    if (transaction.description)
      updateData.description = transaction.description;
    if (transaction.amount) updateData.amount = transaction.amount;
    if (transaction.category) updateData.category = transaction.category;
    if (transaction.date)
      updateData.date = Timestamp.fromDate(new Date(transaction.date));

    await updateDoc(transactionRef, updateData);

    // Lấy dữ liệu cập nhật để trả về
    const updatedSnapshot = await getDoc(transactionRef);
    const updatedData = updatedSnapshot.data();

    return {
      id,
      description: updatedData.description,
      amount: updatedData.amount,
      category: updatedData.category,
      date: updatedData.date.toDate().toISOString().split("T")[0],
    };
  } catch (error) {
    console.error("Lỗi khi cập nhật giao dịch:", error);
    throw error;
  }
}

// Delete a transaction
export async function deleteTransaction(id: string): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Người dùng chưa đăng nhập");
    }

    const transactionRef = doc(db, "transactions", id);
    const transactionSnapshot = await getDoc(transactionRef);

    if (!transactionSnapshot.exists()) {
      throw new Error("Giao dịch không tồn tại");
    }

    const data = transactionSnapshot.data();
    if (data.userId !== user.uid) {
      throw new Error("Không có quyền xóa giao dịch này");
    }

    await deleteDoc(transactionRef);
  } catch (error) {
    console.error("Lỗi khi xóa giao dịch:", error);
    throw error;
  }
}

// Fetch budgets from Firestore
export async function fetchBudgets(): Promise<Budget[]> {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn("Người dùng chưa đăng nhập");
      return []; // Trả về mảng rỗng thay vì ném lỗi
    }

    // Đơn giản hóa truy vấn
    const q = query(collection(db, "budgets"), where("userId", "==", user.uid));

    const querySnapshot = await getDocs(q);
    const budgets: Budget[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      budgets.push({
        id: doc.id,
        userId: data.userId,
        category: data.category,
        limit: data.limit || 0,
        period: data.period || "monthly",
      });
    });

    return budgets;
  } catch (error) {
    console.error("Lỗi khi lấy ngân sách:", error);
    return []; // Trả về mảng rỗng thay vì ném lỗi
  }
}

// Get transaction statistics
export async function getTransactionStats() {
  try {
    const transactions = await fetchTransactions();

    // Tính tổng thu nhập
    const income = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    // Tính tổng chi tiêu
    const expenses = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Thống kê theo danh mục
    const categoryStats = transactions.reduce((stats, t) => {
      const category = t.category;
      if (!stats[category]) {
        stats[category] = 0;
      }
      stats[category] += t.amount < 0 ? Math.abs(t.amount) : 0;
      return stats;
    }, {} as Record<string, number>);

    return {
      income,
      expenses,
      balance: income - expenses,
      categoryStats,
    };
  } catch (error) {
    console.error("Lỗi khi lấy thống kê giao dịch:", error);
    throw error;
  }
}

// Get financial goals
export async function getGoals(): Promise<Goal[]> {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn("Người dùng chưa đăng nhập");
      return []; // Trả về mảng rỗng thay vì ném lỗi
    }

    // Đơn giản hóa truy vấn
    const q = query(collection(db, "goals"), where("userId", "==", user.uid));

    const querySnapshot = await getDocs(q);
    const goals: Goal[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      goals.push({
        id: doc.id,
        name: data.name,
        category: data.category,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount,
        deadline:
          data.deadline instanceof Timestamp
            ? data.deadline.toDate().toISOString().split("T")[0]
            : data.deadline,
      });
    });

    return goals;
  } catch (error) {
    console.error("Lỗi khi lấy mục tiêu tài chính:", error);
    return []; // Trả về mảng rỗng thay vì ném lỗi
  }
}

// Add a new financial goal
export async function addGoal(goal: Omit<Goal, "id">): Promise<Goal> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Người dùng chưa đăng nhập");
    }

    const goalData = {
      userId: user.uid,
      name: goal.name,
      category: goal.category,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: goal.deadline ? new Date(goal.deadline) : null,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "goals"), goalData);

    // Trả về đối tượng mục tiêu hoàn chỉnh với ID mới
    return {
      id: docRef.id,
      name: goal.name,
      category: goal.category,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: goal.deadline,
    };
  } catch (error) {
    console.error("Lỗi khi thêm mục tiêu tài chính:", error);
    throw error;
  }
}

// Update a financial goal
export async function updateGoal(
  id: string,
  goal: Partial<Goal>
): Promise<Goal> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Người dùng chưa đăng nhập");
    }

    const goalRef = doc(db, "goals", id);
    const goalSnapshot = await getDoc(goalRef);

    if (!goalSnapshot.exists()) {
      throw new Error("Mục tiêu tài chính không tồn tại");
    }

    const currentData = goalSnapshot.data();
    if (currentData.userId !== user.uid) {
      throw new Error("Không có quyền cập nhật mục tiêu này");
    }

    const updateData: any = {};
    if (goal.name) updateData.name = goal.name;
    if (goal.category) updateData.category = goal.category;
    if (goal.targetAmount !== undefined)
      updateData.targetAmount = goal.targetAmount;
    if (goal.currentAmount !== undefined)
      updateData.currentAmount = goal.currentAmount;
    if (goal.deadline) updateData.deadline = new Date(goal.deadline);

    await updateDoc(goalRef, updateData);

    // Lấy dữ liệu cập nhật để trả về
    const updatedSnapshot = await getDoc(goalRef);
    const updatedData = updatedSnapshot.data();

    return {
      id,
      name: updatedData.name,
      category: updatedData.category,
      targetAmount: updatedData.targetAmount,
      currentAmount: updatedData.currentAmount,
      deadline:
        updatedData.deadline instanceof Timestamp
          ? updatedData.deadline.toDate().toISOString().split("T")[0]
          : updatedData.deadline,
    };
  } catch (error) {
    console.error("Lỗi khi cập nhật mục tiêu tài chính:", error);
    throw error;
  }
}

// Delete a financial goal
export async function deleteGoal(id: string): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Người dùng chưa đăng nhập");
    }

    const goalRef = doc(db, "goals", id);
    const goalSnapshot = await getDoc(goalRef);

    if (!goalSnapshot.exists()) {
      throw new Error("Mục tiêu tài chính không tồn tại");
    }

    const data = goalSnapshot.data();
    if (data.userId !== user.uid) {
      throw new Error("Không có quyền xóa mục tiêu này");
    }

    await deleteDoc(goalRef);
  } catch (error) {
    console.error("Lỗi khi xóa mục tiêu tài chính:", error);
    throw error;
  }
}

// Get recurring transactions
export async function getRecurringTransactions(): Promise<
  RecurringTransaction[]
> {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn("Người dùng chưa đăng nhập");
      return []; // Trả về mảng rỗng thay vì ném lỗi
    }

    // Đơn giản hóa truy vấn để tránh lỗi chỉ mục và quyền truy cập
    const q = query(
      collection(db, "recurring_transactions"),
      where("userId", "==", user.uid)
      // Bỏ điều kiện isActive để đơn giản hóa truy vấn
    );

    const querySnapshot = await getDocs(q);
    const recurringTransactions: RecurringTransaction[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Chỉ lấy các giao dịch isActive
      if (data.isActive === true) {
        recurringTransactions.push({
          id: doc.id,
          description: data.description,
          amount: data.amount,
          category: data.category,
          frequency: data.frequency,
          nextDate:
            data.nextDate instanceof Timestamp
              ? data.nextDate.toDate().toISOString().split("T")[0]
              : data.nextDate,
          isActive: data.isActive,
        });
      }
    });

    return recurringTransactions;
  } catch (error) {
    console.error("Lỗi khi lấy giao dịch định kỳ:", error);
    return []; // Trả về mảng rỗng thay vì ném lỗi
  }
}

// Classify transaction using AI (mocked)
export async function classifyTransaction(
  description: string
): Promise<{ category: string }> {
  // Simulate API call to OpenAI
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simple keyword matching for demo
      const lowerDesc = description.toLowerCase();

      if (
        lowerDesc.includes("coffee") ||
        lowerDesc.includes("starbucks") ||
        lowerDesc.includes("ăn") ||
        lowerDesc.includes("restaurant") ||
        lowerDesc.includes("lunch") ||
        lowerDesc.includes("dinner")
      ) {
        resolve({ category: "food" });
      } else if (
        lowerDesc.includes("grocery") ||
        lowerDesc.includes("supermarket") ||
        lowerDesc.includes("thực phẩm")
      ) {
        resolve({ category: "groceries" });
      } else if (
        lowerDesc.includes("quần") ||
        lowerDesc.includes("áo") ||
        lowerDesc.includes("clothes") ||
        lowerDesc.includes("shirt") ||
        lowerDesc.includes("pants")
      ) {
        resolve({ category: "clothing" });
      } else if (
        lowerDesc.includes("laptop") ||
        lowerDesc.includes("phone") ||
        lowerDesc.includes("điện thoại") ||
        lowerDesc.includes("máy tính")
      ) {
        resolve({ category: "electronics" });
      } else if (
        lowerDesc.includes("điện") ||
        lowerDesc.includes("nước") ||
        lowerDesc.includes("bill") ||
        lowerDesc.includes("utility")
      ) {
        resolve({ category: "bills" });
      } else if (
        lowerDesc.includes("rent") ||
        lowerDesc.includes("thuê nhà") ||
        lowerDesc.includes("mortgage")
      ) {
        resolve({ category: "rent" });
      } else if (
        lowerDesc.includes("taxi") ||
        lowerDesc.includes("bus") ||
        lowerDesc.includes("train") ||
        lowerDesc.includes("xe")
      ) {
        resolve({ category: "transportation" });
      } else if (
        lowerDesc.includes("doctor") ||
        lowerDesc.includes("hospital") ||
        lowerDesc.includes("medicine") ||
        lowerDesc.includes("bệnh")
      ) {
        resolve({ category: "healthcare" });
      } else if (
        lowerDesc.includes("school") ||
        lowerDesc.includes("tuition") ||
        lowerDesc.includes("học")
      ) {
        resolve({ category: "education" });
      } else if (
        lowerDesc.includes("phim") ||
        lowerDesc.includes("game") ||
        lowerDesc.includes("chơi") ||
        lowerDesc.includes("movie")
      ) {
        resolve({ category: "entertainment" });
      } else if (
        lowerDesc.includes("travel") ||
        lowerDesc.includes("hotel") ||
        lowerDesc.includes("flight") ||
        lowerDesc.includes("du lịch")
      ) {
        resolve({ category: "travel" });
      } else if (
        lowerDesc.includes("gift") ||
        lowerDesc.includes("present") ||
        lowerDesc.includes("quà")
      ) {
        resolve({ category: "gifts" });
      } else if (
        lowerDesc.includes("gym") ||
        lowerDesc.includes("fitness") ||
        lowerDesc.includes("thể dục")
      ) {
        resolve({ category: "fitness" });
      } else if (
        lowerDesc.includes("netflix") ||
        lowerDesc.includes("spotify") ||
        lowerDesc.includes("subscription")
      ) {
        resolve({ category: "subscriptions" });
      } else if (lowerDesc.includes("salary") || lowerDesc.includes("lương")) {
        resolve({ category: "salary" });
      } else if (
        lowerDesc.includes("freelance") ||
        lowerDesc.includes("tự do")
      ) {
        resolve({ category: "freelance" });
      } else if (
        lowerDesc.includes("investment") ||
        lowerDesc.includes("stock") ||
        lowerDesc.includes("đầu tư")
      ) {
        resolve({ category: "investments" });
      } else if (
        lowerDesc.includes("mua") ||
        lowerDesc.includes("buy") ||
        lowerDesc.includes("purchase")
      ) {
        resolve({ category: "shopping" });
      } else {
        resolve({ category: "other" });
      }
    }, 500);
  });
}

// Get AI insights (mocked)
export async function getAiInsights(
  transactions: Transaction[]
): Promise<{ insights: string[] }> {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        insights: [
          "Bạn đã chi 40% thu nhập cho ăn uống - đề xuất giảm 10%",
          "Chi tiêu mua sắm tăng 15% so với tháng trước",
          "Bạn có thể tiết kiệm 500.000₫ bằng cách giảm chi phí giải trí",
        ],
      });
    }, 1500);
  });
}
