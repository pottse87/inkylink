import React, { useEffect, useState } from "react";

const isBrowser = () => typeof window !== "undefined";
const getClientId = () => {
  if (!isBrowser()) return null;
  try { return localStorage.getItem("inkylink_client_id"); } catch { return null; }
};

const IMG_EXTS = new Set([".png", ".jpg", ".jpeg", ".ico"]);
function isImageByKey(key) {
  const i = key.lastIndexOf(".");
  const ext = i >= 0 ? key.slice(i).toLowerCase() : "";
  return IMG_EXTS.has(ext);
}

export default function ThankYou() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        // Prefer client_id from URL (?client_id=...), else localStorage
        let cid = null;
        if (isBrowser()) {
          const sp = new URLSearchParams(window.location.search);
          cid = sp.get("client_id") || getClientId();
        }
        if (!cid) { setNote("Thanks!"); setLoading(false); return; }

        const r = await fetch(`/api/orders/latest?client_id=${encodeURIComponent(cid)}`);
        if (!r.ok) { setNote("Thanks!"); setLoading(false); return; }
        const data = await r.json();
        const order = data?.order || {};
        const list = Array.isArray(order.uploaded_files) ? order.uploaded_files : [];
        if (!cancelled) {
          setFiles(list);
          setNote(list.length ? "We received your files:" : "Thanks! No files were attached.");
          setLoading(false);
        }
      } catch {
        if (!cancelled) { setNote("Thanks!"); setLoading(false); }
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1>Thank you!</h1>
      {loading ? <p>Loading…</p> : <p>{note}</p>}

      {files.length > 0 && (
        <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginTop: 16 }}>
          {files.map((f, idx) => {
            const key = f.key || "";
            const isImg = key && isImageByKey(key);
            return (
              <li key={idx} style={{ border: "1px solid #eee", borderRadius: 10, padding: 10 }}>
                <div style={{ fontWeight: 600, marginBottom: 6, wordBreak: "break-all" }}>{f.name || key || f.url}</div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                  {f.mime || (isImg ? "image/*" : (f.url ? "link" : "file"))} {typeof f.size === "number" ? `· ${(f.size/1024).toFixed(1)} KB` : ""}
                </div>
                {key && isImg ? (
                  <img
                    src={`/api/uploaded-preview?key=${encodeURIComponent(key)}`}
                    alt={f.name || key}
                    style={{ width: "100%", height: 160, objectFit: "contain", borderRadius: 8, background: "#fafafa" }}
                  />
                ) : f.url ? (
                  <a href={f.url} target="_blank" rel="noreferrer">Open link</a>
                ) : (
                  <div style={{ fontSize: 12, color: "#999" }}>Preview not available</div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div style={{ marginTop: 24 }}>
        <a href="/">Return home</a>
      </div>
    </main>
  );
}