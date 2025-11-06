import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "Missing fid" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
      {
        headers: {
          accept: "application/json",
          "x-api-key": process.env.NEYNAR_API_KEY,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      console.error("Neynar API failed:", await res.text());
      return NextResponse.json({ error: "Neynar API failed" }, { status: res.status });
    }

    const data = await res.json();
    const user = data?.users?.[0];

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Neynar returns pfp_url at the top level
    return NextResponse.json({
      fid: user.fid,
      username: user.username,
      display_name: user.display_name,
      bio: user.profile?.bio?.text || null,
      pfp_url: user.pfp_url || null, // ✅ Use pfp_url directly
    });
  } catch (err) {
    console.error("Farcaster API error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}