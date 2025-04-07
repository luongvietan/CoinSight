import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import {
  collection,
  where,
  orderBy,
  query,
  getDocs,
  limit,
} from "firebase/firestore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", userId),
      orderBy("date", "desc"),
      limit(50)
    );

    const snapshot = await getDocs(q);

    const transactions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate().toISOString() || new Date().toISOString(),
    }));

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
