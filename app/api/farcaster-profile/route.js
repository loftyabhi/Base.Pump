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
      }
    );

    const data = await res.json();
    const user = data.result?.users?.[0];
    if (!user) return NextResponse.json({}, { status: 404 });

    return NextResponse.json({
      fid: user.fid,
      username: user.username,
      display_name: user.display_name,
      pfp_url: user.pfp_url,
    });
  } catch (err) {
    console.error("Farcaster API error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
