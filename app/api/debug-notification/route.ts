// app/api/debug-notification/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "basepump123";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔍 [DEBUG] Starting notification debug...");

    // Step 1: Check Supabase connection
    console.log("✅ Supabase client initialized");

    // Step 2: Fetch users
    const { data: users, error: usersError } = await supabase
      .from("user_tokens")
      .select("*");

    console.log("📊 [DEBUG] User tokens query:", { usersError, userCount: users?.length });

    if (usersError) {
      return NextResponse.json({
        error: "Supabase query failed",
        details: usersError,
      }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        status: "no_users",
        message: "No users registered for notifications",
        suggestion: "Add user tokens to the user_tokens table first",
      });
    }

    console.log("👥 [DEBUG] Found users:", users);

    // Step 3: Test notification service URL
    const firstUser = users[0];
    const serviceUrl = firstUser.url;

    console.log("🌐 [DEBUG] Service URL:", serviceUrl);

    if (!serviceUrl) {
      return NextResponse.json({
        error: "No service URL found",
        users: users.map(u => ({ fid: u.fid, token: u.token?.substring(0, 20) + "..." })),
      }, { status: 400 });
    }

    // Step 4: Test fetch to service
    console.log("🚀 [DEBUG] Testing fetch to service URL...");

    const testPayload = {
      notificationId: `debug-${Date.now()}`,
      title: "DEBUG TEST",
      body: "This is a debug test notification",
      targetUrl: "https://basepump.vercel.app",
      tokens: users.map(u => u.token),
    };

    const resp = await fetch(serviceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPayload),
    });

    console.log("📡 [DEBUG] Service response:", { status: resp.status });

    let responseData;
    try {
      responseData = await resp.json();
    } catch (e) {
      responseData = await resp.text();
    }

    console.log("📦 [DEBUG] Response body:", responseData);

    return NextResponse.json({
      status: "debug_complete",
      steps: {
        supabase: "✅ Connected",
        users_found: `✅ ${users.length} users`,
        service_url: `✅ ${serviceUrl}`,
        service_response: `${resp.ok ? "✅" : "❌"} HTTP ${resp.status}`,
      },
      details: {
        users: users.map(u => ({
          fid: u.fid,
          token_preview: u.token?.substring(0, 20) + "...",
          url: u.url,
        })),
        serviceResponse: responseData,
      },
      payload_sent: testPayload,
    });

  } catch (error) {
    console.error("💥 Debug error:", error);
    return NextResponse.json({
      error: "Debug failed",
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}