import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "basepump123";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, body, targetUrl } = await req.json();
    if (!title || !body) {
      return NextResponse.json({ error: "Missing title or body" }, { status: 400 });
    }

    // ✅ Fetch all active tokens from Supabase
    const { data: users, error: usersError } = await supabase
      .from("user_tokens")
      .select("*");

    if (usersError) {
      console.error("❌ Failed to load users:", usersError);
      return NextResponse.json({ error: "Failed to load tokens" }, { status: 500 });
    }

    if (!users?.length) {
      console.warn("⚠️ No users found in Supabase.");
      return NextResponse.json({ message: "No users with notifications enabled" });
    }

    const { url } = users[0];
    const tokens = users.map((u) => u.token);

    const payload = {
      notificationId: `manual-${Date.now()}`,
      title,
      body,
      targetUrl: targetUrl || "https://basepump.vercel.app",
      tokens,
    };

    console.log("📤 Sending notification payload:", payload);

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let data;
    try {
      data = await resp.json();
    } catch {
      data = { message: "Notification sent (no JSON response)" };
    }

    const resultMessage = data.message || "Notification sent successfully!";

    // ✅ Log in Supabase
    const { error: dbError } = await supabase.from("notifications_log").insert([
      {
        title,
        body,
        target_url: targetUrl || "https://basepump.vercel.app",
        tokens,
        response: data,
      },
    ]);

    if (dbError) {
      console.error("❌ Supabase insert failed:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    console.log("🗃️ Logged notification successfully");
    return NextResponse.json({
      sent: true,
      result: resultMessage,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("💥 Send notification error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
