import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { data, error } = await supabase
      .from("notifications_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("❌ Supabase fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch notification history" });
    }

    res.status(200).json({ logs: data });
  } catch (err) {
    console.error("💥 Unexpected error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
