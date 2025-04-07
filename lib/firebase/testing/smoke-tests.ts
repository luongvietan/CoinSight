// lib/firebase/testing/smoke-tests.ts
import fetch from "node-fetch";
import { db } from "../config";
import { doc, getDoc, setDoc } from "firebase/firestore";

describe("Smoke Tests", () => {
  beforeAll(async () => {
    // Tạo document test để kiểm tra kết nối
    await setDoc(doc(db, "test", "connection"), {
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

  it("should load homepage", async () => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(siteUrl);
    expect(res.status).toBe(200);
  });

  it("should connect to Firestore", async () => {
    const testDoc = await getDoc(doc(db, "test", "connection"));
    expect(testDoc.exists()).toBeTruthy();
  });

  it("should call OpenAI API", async () => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const response = await fetch(`${siteUrl}/api/classify-transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description: "Mua cà phê Starbucks",
        userId: "test-user-id",
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("category");
  });
});
