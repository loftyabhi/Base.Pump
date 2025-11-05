import { useState } from "react";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendNotification = async () => {
    if (!title || !body) {
      setStatus("⚠️ Please enter title and body");
      return;
    }

    setIsLoading(true);
    setStatus("Sending...");

    try {
      const res = await fetch("/api/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({ title, body, targetUrl }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus(`✅ ${data.result || "Notification sent successfully!"}`);
      } else {
        setStatus(`❌ ${data.error || "Failed to send notification"}`);
      }
    } catch (err) {
      console.error(err);
      setStatus("❌ Error sending notification");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <h1 className="admin-title">📢 BasePump Notification Admin</h1>

      <div className="admin-form">
        <label>Admin Password</label>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label>Title</label>
        <input
          type="text"
          placeholder="Notification title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label>Body</label>
        <textarea
          placeholder="Notification message"
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />

        <label>Target URL (optional)</label>
        <input
          type="text"
          placeholder="https://example.com"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
        />

        <button
          onClick={sendNotification}
          disabled={isLoading}
          className={isLoading ? "loading" : ""}
        >
          {isLoading ? "Sending..." : "Send Notification"}
        </button>

        {status && <p className="status-message">{status}</p>}
      </div>

      <p className="note">
        ⚙️ Notifications are sent manually to users who enabled them in Farcaster.
      </p>
    </div>
  );
}
