import { useState, useEffect } from "react";
import { getUserTransactions } from "@/lib/firebase/firestore";

export function useTransactions(userId) {
  const [transactions, setTransactions] = useState([]);
  const [lastFetched, setLastFetched] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      // Chỉ fetch mới nếu đã qua 5 phút
      const now = Date.now();
      if (now - lastFetched > 5 * 60 * 1000) {
        const data = await getUserTransactions(userId);
        setTransactions(data);
        setLastFetched(now);
        // Lưu vào localStorage để phòng reload trang
        localStorage.setItem("transactions", JSON.stringify(data));
        localStorage.setItem("lastFetched", now);
      }
    };

    fetchData();
  }, [userId]);

  return transactions;
}
