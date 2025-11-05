import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const event = await req.json();
    console.log("🔔 Webhook Event:", event);

    const { fid, notificationDetails } = event;
    const token = notificationDetails?.token;
    const url = notificationDetails?.url;

    switch (event.event) {
      case "notifications_enabled":
      case "miniapp_added": {
        if (!fid || !token || !url) break;

        const { error } = await supabase
          .from("user_tokens")
          .upsert({ fid, token, url }, { onConflict: "fid" });

        if (error) console.error("❌ Upsert error:", error);
        else console.log(`✅ Notifications enabled for FID ${fid}`);
        break;
      }

      case "notifications_disabled":
      case "miniapp_removed": {
        if (fid) {
          await supabase.from("user_tokens").delete().eq("fid", fid);
          console.log(`❌ Notifications disabled for FID ${fid}`);
        }
        break;
      }

      default:
        console.log("⚙️ Unhandled event type:", event.event);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("💥 Webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
