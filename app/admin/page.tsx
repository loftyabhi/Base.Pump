"use client";

import { useState } from "react";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

  const sendNotification = async () => {
    if (!title || !body) {
      setStatus("⚠️ Please enter title and body");
      return;
    }

    if (!password) {
      setStatus("⚠️ Please enter the admin password");
      return;
    }

    setIsLoading(true);
    setStatus("Sending...");
    setDebugInfo("");

    try {
      console.log("📤 Sending with password:", password);
      
      const res = await fetch("/api/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({ title, body, targetUrl }),
      });

      const data = await res.json();
      
      console.log("Response status:", res.status);
      console.log("Response data:", data);

      if (res.ok) {
        setStatus(`✅ ${data.result || "Notification sent successfully!"} (${data.tokensSent || 0} tokens)`);
        setTitle("");
        setBody("");
        setTargetUrl("");
        setPassword("");
      } else {
        setStatus(`❌ ${data.error || "Failed to send notification"}`);
        setDebugInfo(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      console.error(err);
      setStatus("❌ Error sending notification: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const testPassword = async () => {
    setIsLoading(true);
    setStatus("Testing password...");
    
    try {
      const testPwd = password || "basepump123";
      console.log("🔍 Testing with password:", testPwd);
      
      const res = await fetch("/api/debug-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testPwd}`,
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      
      console.log("Debug response:", data);
      
      if (res.ok) {
        setStatus("✅ Password is correct!");
        setDebugInfo(JSON.stringify(data, null, 2));
      } else {
        setStatus(`❌ Password incorrect or error: ${data.error}`);
        setDebugInfo(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      console.error(err);
      setStatus("❌ Error: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <h1 className="admin-title">📢 BasePump Notification Admin</h1>

      <div className="admin-form">
        <label>Admin Password</label>
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <input
            type="password"
            placeholder="Enter password (default: basepump123)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            style={{ flex: 1 }}
          />
          <button
            onClick={testPassword}
            disabled={isLoading}
            style={{
              padding: "10px 15px",
              background: "#666",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            🔍 Test
          </button>
        </div>

        <label>Title</label>
        <input
          type="text"
          placeholder="Notification title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isLoading}
        />

        <label>Body</label>
        <textarea
          placeholder="Notification message"
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={isLoading}
        />

        <label>Target URL (optional)</label>
        <input
          type="text"
          placeholder="https://example.com"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          disabled={isLoading}
        />

        <button
          onClick={sendNotification}
          disabled={isLoading}
          className={isLoading ? "loading" : ""}
          style={{
            background: isLoading ? "#999" : "#2563eb",
          }}
        >
          {isLoading ? "Sending..." : "Send Notification"}
        </button>

        {status && (
          <p 
            className="status-message"
            style={{
              background: status.includes("✅") ? "#d1fae5" : status.includes("❌") ? "#fee2e2" : "#eef2ff",
              color: status.includes("✅") ? "#065f46" : status.includes("❌") ? "#7f1d1d" : "#1e3a8a",
            }}
          >
            {status}
          </p>
        )}

        {debugInfo && (
          <div style={{
            marginTop: "15px",
            padding: "10px",
            background: "#f3f4f6",
            borderRadius: "8px",
            maxHeight: "200px",
            overflow: "auto",
            fontFamily: "monospace",
            fontSize: "0.85rem",
            color: "#333",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}>
            <b>Debug Info:</b>
            <br />
            {debugInfo}
          </div>
        )}
      </div>

      <p className="note" style={{ marginTop: "25px" }}>
        ⚙️ <b>Setup Instructions:</b>
        <br />
        1. First, click the "🔍 Test" button to verify your password
        <br />
        2. Default password: <code style={{ background: "#f0f0f0", padding: "2px 6px", borderRadius: "3px" }}>basepump123</code>
        <br />
        3. Make sure you have users registered in your Supabase <code>user_tokens</code> table
        <br />
        4. If test fails, check your <code>.env</code> file for <code>ADMIN_PASSWORD</code>
      </p>
    </div>
  );
}