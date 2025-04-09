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
      // console.warn("Người dùng chưa đăng nhập");
      return [];
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
    // console.error("Lỗi khi lấy giao dịch:", error);
    return [];
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
    // console.error("Lỗi khi thêm giao dịch:", error);
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

    if (!updatedData) {
      throw new Error("Không thể lấy dữ liệu đã cập nhật");
    }

    return {
      id,
      description: updatedData.description,
      amount: updatedData.amount,
      category: updatedData.category,
      date: updatedData?.date?.toDate().toISOString().split("T")[0] || "",
    };
  } catch (error) {
    // console.error("Lỗi khi cập nhật giao dịch:", error);
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
    // console.error("Lỗi khi xóa giao dịch:", error);
    throw error;
  }
}

// Fetch budgets from Firestore
export async function fetchBudgets(): Promise<Budget[]> {
  try {
    const user = auth.currentUser;
    if (!user) {
      // console.warn("Người dùng chưa đăng nhập");
      return [];
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
        amount: 0,
      });
    });

    return budgets;
  } catch (error) {
    // console.error("Lỗi khi lấy ngân sách:", error);
    return [];
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
    // console.error("Lỗi khi lấy thống kê giao dịch:", error);
    return {
      totalIncome: 0,
      totalExpense: 0,
      netIncome: 0,
      categoryBreakdown: [],
    };
  }
}

// Get financial goals
export async function getGoals(): Promise<Goal[]> {
  try {
    const user = auth.currentUser;
    if (!user) {
      // console.warn("Người dùng chưa đăng nhập");
      return [];
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
    // console.error("Lỗi khi lấy mục tiêu tài chính:", error);
    return [];
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
    // console.error("Lỗi khi thêm mục tiêu tài chính:", error);
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
    if (!updatedData) {
      throw new Error("Dữ liệu cập nhật không tồn tại");
    }

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
    // console.error("Lỗi khi cập nhật mục tiêu tài chính:", error);
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
    // console.error("Lỗi khi xóa mục tiêu tài chính:", error);
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
      // console.warn("Người dùng chưa đăng nhập");
      return [];
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
    // console.error("Lỗi khi lấy giao dịch định kỳ:", error);
    return [];
  }
}

// Classify transaction using API route
export async function classifyTransaction(
  description: string
): Promise<{ category: string }> {
  try {
    if (!description || description.trim() === "") {
      return { category: "other" };
    }

    // Kiểm tra từ khóa đơn giản trước để giảm thiểu API calls
    const lowerDesc = description.toLowerCase();
    if (
      lowerDesc.includes("coffee") ||
      lowerDesc.includes("starbucks") ||
      lowerDesc.includes("ăn") ||
      lowerDesc.includes("restaurant") ||
      lowerDesc.includes("lunch") ||
      lowerDesc.includes("dinner")
    ) {
      return { category: "food" };
    } else if (lowerDesc.includes("salary") || lowerDesc.includes("lương")) {
      return { category: "salary" };
    }

    // Lấy token người dùng hiện tại
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Người dùng chưa đăng nhập");
    }

    const idToken = await user.getIdToken();

    // Gọi API route nội bộ
    const response = await fetch("/api/classify-transaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ description }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return { category: data.category || "other" };
  } catch (error) {
    // console.error("Lỗi khi gọi API phân loại giao dịch:", error);
    return fallbackClassify(description.toLowerCase());
  }
}

// Hàm phân loại dự phòng khi API lỗi
function fallbackClassify(lowerDesc: string): { category: string } {
  if (
    lowerDesc.includes("coffee") ||
    lowerDesc.includes("starbucks") ||
    lowerDesc.includes("ăn") ||
    lowerDesc.includes("restaurant") ||
    lowerDesc.includes("lunch") ||
    lowerDesc.includes("dinner")
  ) {
    return { category: "food" };
  } else if (
    lowerDesc.includes("grocery") ||
    lowerDesc.includes("supermarket") ||
    lowerDesc.includes("thực phẩm")
  ) {
    return { category: "groceries" };
  } else if (
    lowerDesc.includes("quần") ||
    lowerDesc.includes("áo") ||
    lowerDesc.includes("clothes") ||
    lowerDesc.includes("shirt") ||
    lowerDesc.includes("pants")
  ) {
    return { category: "clothing" };
  } else if (
    lowerDesc.includes("laptop") ||
    lowerDesc.includes("phone") ||
    lowerDesc.includes("điện thoại") ||
    lowerDesc.includes("máy tính")
  ) {
    return { category: "electronics" };
  } else if (
    lowerDesc.includes("điện") ||
    lowerDesc.includes("nước") ||
    lowerDesc.includes("bill") ||
    lowerDesc.includes("utility")
  ) {
    return { category: "bills" };
  } else if (
    lowerDesc.includes("rent") ||
    lowerDesc.includes("thuê nhà") ||
    lowerDesc.includes("mortgage")
  ) {
    return { category: "rent" };
  } else if (
    lowerDesc.includes("taxi") ||
    lowerDesc.includes("bus") ||
    lowerDesc.includes("train") ||
    lowerDesc.includes("xe")
  ) {
    return { category: "transportation" };
  } else if (
    lowerDesc.includes("doctor") ||
    lowerDesc.includes("hospital") ||
    lowerDesc.includes("medicine") ||
    lowerDesc.includes("bệnh")
  ) {
    return { category: "healthcare" };
  } else if (
    lowerDesc.includes("school") ||
    lowerDesc.includes("tuition") ||
    lowerDesc.includes("học")
  ) {
    return { category: "education" };
  } else if (
    lowerDesc.includes("phim") ||
    lowerDesc.includes("game") ||
    lowerDesc.includes("chơi") ||
    lowerDesc.includes("movie")
  ) {
    return { category: "entertainment" };
  } else if (
    lowerDesc.includes("travel") ||
    lowerDesc.includes("hotel") ||
    lowerDesc.includes("flight") ||
    lowerDesc.includes("du lịch")
  ) {
    return { category: "travel" };
  } else if (
    lowerDesc.includes("gift") ||
    lowerDesc.includes("present") ||
    lowerDesc.includes("quà")
  ) {
    return { category: "gifts" };
  } else if (
    lowerDesc.includes("gym") ||
    lowerDesc.includes("fitness") ||
    lowerDesc.includes("thể dục")
  ) {
    return { category: "fitness" };
  } else if (
    lowerDesc.includes("netflix") ||
    lowerDesc.includes("spotify") ||
    lowerDesc.includes("subscription")
  ) {
    return { category: "subscriptions" };
  } else if (lowerDesc.includes("salary") || lowerDesc.includes("lương")) {
    return { category: "salary" };
  } else if (lowerDesc.includes("freelance") || lowerDesc.includes("tự do")) {
    return { category: "freelance" };
  } else if (
    lowerDesc.includes("investment") ||
    lowerDesc.includes("stock") ||
    lowerDesc.includes("đầu tư")
  ) {
    return { category: "investments" };
  } else if (
    lowerDesc.includes("mua") ||
    lowerDesc.includes("buy") ||
    lowerDesc.includes("purchase")
  ) {
    return { category: "shopping" };
  } else {
    return { category: "other" };
  }
}

// Get AI insights using local API route
export async function getAiInsights(transactions: Transaction[]): Promise<{
  insights: string[];
  is_sample_data?: boolean;
  reason?: string;
  error?: string;
}> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Người dùng chưa đăng nhập");
    }

    // Kiểm tra cache
    const cacheKey = `ai_insights_${hashTransactions(transactions)}`;
    const cachedData = localStorage.getItem(cacheKey);
    const now = new Date().getTime();

    if (cachedData) {
      try {
        const { data, timestamp } = JSON.parse(cachedData);
        const cacheAge = now - timestamp;

        // Cache hợp lệ trong 1 giờ
        if (cacheAge < 3600000) {
          return data;
        }
      } catch (e) {
        // Nếu cache không hợp lệ, xóa nó
        localStorage.removeItem(cacheKey);
      }
    }

    // Tối ưu hóa dữ liệu giao dịch
    const optimizedTransactions = transactions.slice(-50); // Chỉ lấy 50 giao dịch gần nhất

    const idToken = await user.getIdToken();

    // Hàm thực hiện request với retry
    const makeRequest = async (retryCount = 0): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // Tăng timeout lên 60 giây

      try {
        const response = await fetch("/api/ai-insights", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          body: JSON.stringify({
            transactions: simplifyTransactions(optimizedTransactions),
          }),
          signal: controller.signal,
          cache: "no-store",
          next: { revalidate: 0 },
        });

        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        // Kiểm tra xem lỗi có phải đến từ môi trường Vercel hay không
        if (
          typeof window !== "undefined" &&
          window.location.hostname.includes("vercel.app")
        ) {
          console.warn(
            "[API Client getAiInsights] Vercel environment detected, using fallback insights"
          );
          // Trả về fallback data ngay lập tức khi ở môi trường Vercel và có lỗi kết nối
          return new Response(
            JSON.stringify({
              insights: [
                "Bạn đã chi 40% thu nhập cho ăn uống - đề xuất giảm 10%",
                "Chi tiêu mua sắm tăng 15% so với tháng trước",
                "Bạn có thể tiết kiệm 500.000₫ bằng cách giảm chi phí giải trí",
              ],
              is_sample_data: true,
              reason: "Vercel environment: API route không thể kết nối",
            })
          );
        }
        throw error;
      }
    };

    // Thực hiện request với retry
    let lastError;
    for (let i = 0; i < 3; i++) {
      try {
        const response = await makeRequest(i);

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        // Kiểm tra xem API có trả về insights không
        if (
          !data.insights ||
          !Array.isArray(data.insights) ||
          data.insights.length === 0
        ) {
          return {
            insights: [
              "Bạn đã chi 40% thu nhập cho ăn uống - đề xuất giảm 10%",
              "Chi tiêu mua sắm tăng 15% so với tháng trước",
              "Bạn có thể tiết kiệm 500.000₫ bằng cách giảm chi phí giải trí",
            ],
            is_sample_data: true,
            reason: "API trả về mảng insights rỗng hoặc không hợp lệ",
          };
        }

        // Lưu kết quả vào cache
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data,
            timestamp: now,
          })
        );

        return data;
      } catch (error) {
        lastError = error;
        if (error instanceof Error && error.name === "AbortError") {
          // Nếu là lỗi timeout, đợi một chút trước khi thử lại
          await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
          continue;
        }
        throw error;
      }
    }

    // Nếu đã thử 3 lần mà vẫn thất bại
    throw lastError;
  } catch (error) {
    console.error("[API Client getAiInsights] Error:", error);
    return {
      insights: [
        "Bạn đã chi 40% thu nhập cho ăn uống - đề xuất giảm 10%",
        "Chi tiêu mua sắm tăng 15% so với tháng trước",
        "Bạn có thể tiết kiệm 500.000₫ bằng cách giảm chi phí giải trí",
      ],
      is_sample_data: true,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Hàm tạo hash đơn giản từ mảng giao dịch để làm cache key
function hashTransactions(transactions: Transaction[]): string {
  // Chỉ lấy các trường quan trọng và đảm bảo thứ tự nhất quán
  const simpleTransactions = simplifyTransactions(transactions);

  // Tạo chuỗi MD5 hash từ chuỗi JSON
  let hash = 0;
  const str = JSON.stringify(simpleTransactions);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString(16);
}

// Đơn giản hóa mảng giao dịch, chỉ giữ lại các trường cần thiết cho AI
function simplifyTransactions(transactions: Transaction[]): any[] {
  return transactions.map((t) => ({
    id: t.id,
    amount: t.amount,
    category: t.category,
    date: t.date,
  }));
}

// Add a new recurring transaction
export async function addRecurringTransaction(
  recurring: Omit<RecurringTransaction, "id">
): Promise<RecurringTransaction> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Người dùng chưa đăng nhập");
    }

    const recurringData = {
      userId: user.uid,
      description: recurring.description,
      amount: recurring.amount,
      category: recurring.category,
      frequency: recurring.frequency,
      nextDate: Timestamp.fromDate(new Date(recurring.nextDate)),
      isActive: recurring.isActive,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, "recurring_transactions"),
      recurringData
    );

    return {
      id: docRef.id,
      ...recurring,
    };
  } catch (error) {
    // console.error("Lỗi khi thêm giao dịch định kỳ:", error);
    throw error;
  }
}

// Update a recurring transaction
export async function updateRecurringTransaction(
  recurring: RecurringTransaction
): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Người dùng chưa đăng nhập");
    }

    const recurringRef = doc(db, "recurring_transactions", recurring.id);
    await updateDoc(recurringRef, {
      description: recurring.description,
      amount: recurring.amount,
      category: recurring.category,
      frequency: recurring.frequency,
      nextDate: Timestamp.fromDate(new Date(recurring.nextDate)),
      isActive: recurring.isActive,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    // console.error("Lỗi khi cập nhật giao dịch định kỳ:", error);
    throw error;
  }
}

// Delete a recurring transaction
export async function deleteRecurringTransaction(
  recurringId: string
): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Người dùng chưa đăng nhập");
    }

    const recurringRef = doc(db, "recurring_transactions", recurringId);
    await deleteDoc(recurringRef);
  } catch (error) {
    // console.error("Lỗi khi xóa giao dịch định kỳ:", error);
    throw error;
  }
}

// Process recurring transactions - check and create transactions based on scheduled dates
export async function processRecurringTransactions(): Promise<{
  processedCount: number;
  totalAmount: number;
  transactions: Array<{
    description: string;
    amount: number;
    date: string;
  }>;
}> {
  try {
    const user = auth.currentUser;
    if (!user) {
      // console.warn("Người dùng chưa đăng nhập");
      return { processedCount: 0, totalAmount: 0, transactions: [] };
    }

    // Lấy tất cả giao dịch định kỳ và giao dịch thường
    const recurringTransactions = await getRecurringTransactions();
    const transactions = await fetchTransactions();

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    let processedCount = 0;
    let totalAmount = 0;
    const processedTransactions: Array<{
      description: string;
      amount: number;
      date: string;
    }> = [];

    for (const recurring of recurringTransactions) {
      if (!recurring.isActive) continue;

      const nextDate = new Date(recurring.nextDate);
      nextDate.setHours(0, 0, 0, 0); // Reset time to start of day

      // Kiểm tra nếu nextDate <= today (đã đến hoặc đã qua hạn)
      if (nextDate <= today) {
        const dateStr = nextDate.toISOString().split("T")[0];

        // Kiểm tra nếu giao dịch đã tồn tại (tránh trùng lặp)
        const transactionDescription = `${recurring.description} (Tự động)`;
        const isDuplicate = transactions.some(
          (t) =>
            t.description === transactionDescription &&
            t.amount === recurring.amount &&
            t.date === dateStr
        );

        if (!isDuplicate) {
          // Tạo giao dịch mới từ recurring transaction
          await addTransaction({
            description: transactionDescription,
            amount: recurring.amount,
            category: recurring.category,
            date: dateStr,
          });

          processedCount++;
          totalAmount += Math.abs(recurring.amount);
          processedTransactions.push({
            description: recurring.description,
            amount: recurring.amount,
            date: dateStr,
          });
        }

        // Tính toán ngày tiếp theo dựa trên tần suất
        let newNextDate = new Date(nextDate);

        switch (recurring.frequency) {
          case "daily":
            newNextDate.setDate(newNextDate.getDate() + 1);
            break;
          case "weekly":
            newNextDate.setDate(newNextDate.getDate() + 7);
            break;
          case "monthly":
            newNextDate.setMonth(newNextDate.getMonth() + 1);
            break;
          case "yearly":
            newNextDate.setFullYear(newNextDate.getFullYear() + 1);
            break;
        }

        // Cập nhật recurring transaction với ngày tiếp theo mới
        await updateDoc(doc(db, "recurring_transactions", recurring.id), {
          nextDate: Timestamp.fromDate(newNextDate),
          updatedAt: serverTimestamp(),
        });
      }
    }

    return {
      processedCount,
      totalAmount,
      transactions: processedTransactions,
    };
  } catch (error) {
    // console.error("Lỗi khi xử lý giao dịch định kỳ:", error);
    return { processedCount: 0, totalAmount: 0, transactions: [] };
  }
}
