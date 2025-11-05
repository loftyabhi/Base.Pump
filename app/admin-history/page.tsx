"use client";

import { useEffect, useState } from "react";

type NotificationLog = {
  id: string;
  title: string;
  body: string;
  target_url: string;
  created_at: string;
  token_count?: number;
  response: any;
};

export default function AdminHistoryPage() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/get-history");
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
        setError("");
      } else {
        setError(data.error || "Failed to fetch logs");
      }
    } catch (err) {
      console.error(err);
      setError("Error loading history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="history-container">
      <h1 className="history-title">📜 Notification History</h1>

      {loading ? (
        <p className="status-msg">Loading history...</p>
      ) : error ? (
        <p className="status-msg error">{error}</p>
      ) : logs.length === 0 ? (
        <p className="status-msg">No notifications sent yet.</p>
      ) : (
        <div className="history-list">
          {logs.map((log) => (
            <div key={log.id} className="history-card">
              <div className="history-header">
                <h2>{log.title}</h2>
                <span className="time">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>

              <p className="body">{log.body}</p>

              <div className="meta">
                <span>🎯 <b>Target:</b> {log.target_url}</span>
                <span>👥 <b>Tokens Sent:</b> {log.token_count || 0}</span>
              </div>

              <div className="response">
                <b>Response:</b>{" "}
                <span>
                  {log.response?.message ||
                    log.response?.result ||
                    "✅ OK"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="refresh-note">⏱️ Auto-refreshes every 10 seconds</p>
    </div>
  );
}