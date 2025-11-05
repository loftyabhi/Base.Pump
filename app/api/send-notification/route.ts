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
      .select("token, url")
      .limit(1);

    if (usersError) {
      console.error("❌ Failed to load users:", usersError);
      return NextResponse.json({ error: "Failed to load tokens" }, { status: 500 });
    }

    if (!users || users.length === 0) {
      console.warn("⚠️ No users found in Supabase.");
      return NextResponse.json({ 
        message: "No users with notifications enabled",
        sent: false 
      });
    }

    // Get the service URL from first user and all tokens
    const { data: allTokens, error: allTokensError } = await supabase
      .from("user_tokens")
      .select("token");

    if (allTokensError || !allTokens) {
      console.error("❌ Failed to fetch all tokens:", allTokensError);
      return NextResponse.json({ error: "Failed to fetch tokens" }, { status: 500 });
    }

    const serviceUrl = users[0]?.url;
    if (!serviceUrl) {
      console.error("❌ No service URL found");
      return NextResponse.json({ error: "Service URL not configured" }, { status: 500 });
    }

    const tokens = allTokens.map((u) => u.token);

    const payload = {
      notificationId: `manual-${Date.now()}`,
      title,
      body,
      targetUrl: targetUrl || "https://basepump.vercel.app",
      tokens,
    };

    console.log("📤 Sending notification payload:", { title, body, tokenCount: tokens.length });

    // ✅ Fetch to service and read response once
    const resp = await fetch(serviceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Read response body only once
    const responseText = await resp.text();
    let responseData: any = {};
    
    if (responseText) {
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { message: responseText };
      }
    }

    if (!resp.ok) {
      console.error("❌ Notification service error:", resp.status, responseData);
      // Still log the attempt even if service failed
      try {
        await supabase.from("notifications_log").insert([
          {
            title,
            body,
            target_url: targetUrl || "https://basepump.vercel.app",
            token_count: tokens.length,
            response: { error: true, status: resp.status, data: responseData },
          },
        ]);
      } catch (logErr) {
        console.warn("⚠️ Failed to log failed notification:", logErr);
      }
      
      return NextResponse.json({ 
        error: `Service returned ${resp.status}`,
        details: responseData 
      }, { status: resp.status });
    }

    const resultMessage = responseData.message || responseData.result || "Notification sent successfully!";

    // ✅ Log in Supabase
    try {
      const { error: dbError } = await supabase.from("notifications_log").insert([
        {
          title,
          body,
          target_url: targetUrl || "https://basepump.vercel.app",
          token_count: tokens.length,
          response: responseData,
        },
      ]);

      if (dbError) {
        console.error("❌ Supabase insert failed:", dbError);
        // Don't fail the whole request if logging fails
        return NextResponse.json({
          sent: true,
          result: resultMessage,
          tokensSent: tokens.length,
          warning: "Notification sent but logging failed: " + dbError.message,
          timestamp: new Date().toISOString(),
        });
      }

      console.log("🗃️ Logged notification successfully");
    } catch (logError) {
      console.error("💥 Logging error:", logError);
      return NextResponse.json({
        sent: true,
        result: resultMessage,
        tokensSent: tokens.length,
        warning: "Notification sent but logging error occurred",
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      sent: true,
      result: resultMessage,
      tokensSent: tokens.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("💥 Send notification error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal Server Error" 
    }, { status: 500 });
  }
}