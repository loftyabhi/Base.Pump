import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-neynar-signature-256");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const bodyText = await req.text();
    const computed = crypto
      .createHmac("sha256", process.env.NEYNAR_WEBHOOK_SECRET!)
      .update(bodyText)
      .digest("hex");

    if (computed !== signature) {
      console.warn("❌ Invalid Neynar signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(bodyText);

    // ✅ Example: handle event types
    switch (body.type) {
      case "cast.created":
        console.log(
          `🟣 New cast: ${body.data.cast.text} (by ${body.data.cast.author.username})`
        );
        break;
      case "reaction.added":
        console.log(`💜 Reaction: ${body.data.reaction.type}`);
        break;
      case "user.followed":
        console.log(
          `👥 ${body.data.source.username} followed ${body.data.target.username}`
        );
        break;
      default:
        console.log("📦 Unhandled event:", body.type);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
