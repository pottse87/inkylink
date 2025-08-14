import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

const isBrowser = () => typeof window !== "undefined";
const getClientId = () => {
  if (!isBrowser()) return null;
  try { return localStorage.getItem("inkylink_client_id"); } catch { return null; }
};

const slugify = (s) => String(s || "")
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, "")
  .replace(/\s+/g, "-")
  .replace(/-+/g, "-");

const MAX_MB = 25;
const MAX_BYTES = MAX_MB * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "application/pdf", "image/x-icon"]);

export default function IntakeForm() {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [templates, setTemplates] = useState({});
  const [formData, setFormData] = useState({});
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState({});
  const [links, setLinks] = useState([]);
  const [linkInput, setLinkInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const resolve = async () => {
      try {
        const tRes = await fetch("/form_templates.json");
        const t = await tRes.json();
        if (cancelled) return;
        setTemplates(t);

        const ordParam = router.query?.order;
        if (ordParam) {
          try {
            const parsed = JSON.parse(decodeURIComponent(String(ordParam)));
            if (!cancelled) setOrder(parsed);
            return;
          } catch (e) { console.error("Order parse failed:", e); }
        }

        const cid = String(router.query?.client_id || "") || getClientId();
        try { if (cid) localStorage.setItem("inkylink_client_id", cid); } catch {}
        if (!cid) { if (!cancelled) setLoadError("Missing client_id. Cannot load your items."); return; }

        const r = await fetch(`/api/get-cloud-cart?client_id=${encodeURIComponent(cid)}`);
        if (!r.ok) throw new Error(await r.text());
        const cart = await r.json();
        const items = Array.isArray(cart.items) ? cart.items : [];
        if (!items.length && !cancelled) setLoadError("Your cart is empty. Please add items first.");
        if (!cancelled) setOrder({ items, client_id: cid });
      } catch (err) {
        console.error("Intake load error:", err);
        if (!cancelled) setLoadError("Failed to load order/cart.");
      }
    };
    resolve();
    return () => { cancelled = true; };
  }, [router.query]);

  useEffect(() => {
    if (!order || !Array.isArray(order.items)) return;
    const total = order.items.reduce((sum, item) => {
      const q = Number.isFinite(+item.quantity) ? Math.max(1, Math.floor(+item.quantity)) : 1;
      return sum + (Number(item.price) || 0) * q;
    }, 0);
    setTotalPrice(total);

    const initial = {};
    order.items.forEach((item) => {
      const key = slugify(item.id);
      const qs = Array.isArray(templates[key]) ? templates[key] : [];
      initial[item.id] = qs.map((q) => ({ question: q.question, answer: "" }));
    });
    setFormData(initial);
  }, [order, templates]);

  const handleChange = (itemId, index, value) => {
    setFormData((prev) => {
      const next = { ...prev };
      if (!next[itemId]) next[itemId] = [];
      next[itemId] = next[itemId].map((e, i) => i === index ? { ...e, answer: value } : e);
      return next;
    });
  };

  const onPickFiles = (ev) => {
    const picked = Array.from(ev.target.files || []);
    const errors = [];
    const ok = [];
    for (const f of picked) {
      if (!ALLOWED.has(f.type)) { errors.push(`${f.name}: unsupported type ${f.type}`); continue; }
      if (f.size > MAX_BYTES) { errors.push(`${f.name}: exceeds ${MAX_MB} MB`); continue; }
      ok.push(f);
    }
    if (errors.length) alert(errors.join("\n"));
    if (ok.length) setFiles((prev) => [...prev, ...ok]);
    ev.target.value = "";
  };

  const removeFile = (name) => {
    setFiles((prev) => prev.filter(f => f.name !== name));
    setProgress((p) => { const n = { ...p }; delete n[name]; return n; });
  };

  const addLink = () => {
    const u = (linkInput || "").trim();
    if (!u) return;
    try { const valid = new URL(u); setLinks((prev) => [...prev, { url: valid.toString() }]); setLinkInput(""); }
    catch { alert("Please enter a valid URL (e.g., https://...)"); }
  };
  const removeLink = (url) => setLinks((prev) => prev.filter(l => l.url !== url));

  async function uploadSelectedFiles() {
    if (!files.length) return [];
    const out = [];
    for (const f of files) {
      const fd = new FormData();
      fd.append("file", f, f.name);
      setProgress((p) => ({ ...p, [f.name]: 10 }));
      const resp = await fetch("/api/upload", { method: "POST", body: fd });
      setProgress((p) => ({ ...p, [f.name]: 60 }));
      if (!resp.ok) { const txt = await resp.text().catch(()=> ""); console.error("upload failed:", txt); throw new Error(`Upload failed for ${f.name}`); }
      const data = await resp.json();
      const rec = (data?.files || [])[0];
      if (rec?.key) { out.push({ key: rec.key, name: f.name, size: f.size, mime: f.type }); setProgress((p) => ({ ...p, [f.name]: 100 })); }
      else { throw new Error(`No key returned for ${f.name}`); }
    }
    return out;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!order || submitting) return;
    setSubmitError(""); setSubmitting(true);
    const qp = isBrowser() ? new URLSearchParams(window.location.search) : null;

    try {
      const uploaded = await uploadSelectedFiles();
      const uploaded_files = [
        ...uploaded.map(x => ({ key: x.key, name: x.name, size: x.size, mime: x.mime })),
        ...links.map(l => ({ url: l.url })),
      ];
      const formPayload = {
        customer_email: "",
        plan: null,
        bundle_ids: order?.items?.map(item => ({ ...item, id: slugify(item.id) })) || [],
        client_feedback: "",
        rework_count: 0,
        ai_assistant: "ChatGPT",
        total_price: totalPrice,
        approved: false,
        delivered: false,
        source_page: "forms",
        internal_notes: "",
        client_name: order?.client_name || "",
        revision_limit: order?.revision_limit || 3,
        assistant_output: { qa: formData || {}, uploaded_files },
        uploaded_files,
        payment_status: "unpaid",
        source_campaign: order?.source_campaign || "organic",
        completion_time_ms: 0,
        priority_level: "normal",
        language: "en",
        review_notes: "",
        recurring: false,
        submitted_at: new Date().toISOString(),
        feedback_submitted_at: null,
        status: "ready_for_ai",
        session_id: qp ? qp.get("session_id") : null,
        order_id:   qp ? qp.get("order_id")   : null,
        client_id:  qp ? qp.get("client_id")  : null,
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const resp = await fetch("/api/save-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formPayload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!resp.ok) {
        const txt = await resp.text().catch(()=> "");
        console.error("save-order failed:", txt);
        setSubmitError("There was an issue submitting your form. Please try again.");
        setSubmitting(false);
        return;
      }
      const data = await resp.json().catch(()=> ({}));
      setSubmitted(true);
if (data?.duplicate) console.warn("Duplicate submit detected; treating as success.");
try { sessionStorage.setItem("inkylink_last_uploaded", JSON.stringify(uploaded_files)); } catch {}
const __cid = (qp && (qp.get("client_id") || "")) || (order?.client_id || (isBrowser() ? (localStorage.getItem("inkylink_client_id")||"") : ""));
        window.location.assign(`/thankyou${__cid ? `?client_id=${encodeURIComponent(__cid)}` : ""}`);
    } catch (err) {
      console.error("Submission error:", err);
      setSubmitError(err?.name === "AbortError" ? "Network timeout. Please check your connection and try again." : (err?.message || "Something went wrong. Please try again."));
      setSubmitting(false);
    }
  };

  if (loadError) return <main style={{ padding: 24 }}><p>{loadError}</p></main>;
  if (!order) return <main style={{ padding: 24 }}><p>Loading...</p></main>;

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginBottom: 16 }}>Project Intake</h1>
      {Boolean(totalPrice) && <p style={{ marginBottom: 16 }}>Estimated total: ${Number(totalPrice || 0).toFixed(2)}</p>}

      <form onSubmit={handleSubmit}>
        {order.items.map((item) => {
          const entries = formData[item.id] || [];
          return (
            <section key={item.id} style={{ padding: "12px 0", borderBottom: "1px solid #eee", marginBottom: 12 }}>
              <h3 style={{ marginBottom: 8 }}>{item.name || item.id}</h3>
              {entries.map((entry, index) => (
                <div key={`${item.id}_${index}`} style={{ marginBottom: 10 }}>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>{entry.question}</label>
                  <input
                    type="text"
                    value={entry.answer}
                    onChange={(e) => handleChange(item.id, index, e.target.value)}
                    required
                    style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 8 }}
                  />
                </div>
              ))}
            </section>
          );
        })}

        {/* Direct uploader */}
        <section style={{ marginTop: 16, paddingTop: 12, borderTop: "2px solid #ddd" }}>
          <p style={{ marginBottom: 8 }}><strong>Upload reference files</strong></p>
          <p style={{ marginBottom: 12 }}>Accepted types: PNG, JPEG, PDF, ICO. Max {MAX_MB} MB per file.</p>
          <input type="file" multiple accept=".png,.jpg,.jpeg,.pdf,.ico,application/pdf,image/png,image/jpeg,image/x-icon" onChange={onPickFiles} />
          {files.length > 0 && (
            <ul style={{ marginTop: 8 }}>
              {files.map(f => (
                <li key={f.name} style={{ marginBottom: 6 }}>
                  {f.name} — {(f.size/1024/1024).toFixed(2)} MB
                  {progress[f.name] != null && <span style={{ marginLeft: 8 }}>({progress[f.name]}%)</span>}
                  <button type="button" onClick={() => removeFile(f.name)} style={{ marginLeft: 8 }}>remove</button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Optional links */}
        <section style={{ marginTop: 16 }}>
          <p style={{ marginBottom: 8 }}><strong>Or paste links to reference files</strong></p>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input type="url" placeholder="https://example.com/your-file" value={linkInput} onChange={(e) => setLinkInput(e.target.value)} style={{ flex: 1, padding: 8, border: "1px solid #ccc", borderRadius: 8 }} />
            <button type="button" onClick={addLink}>Add</button>
          </div>
          {links.length > 0 && (
            <ul style={{ marginTop: 8 }}>
              {links.map(l => (
                <li key={l.url} style={{ marginBottom: 6 }}>
                  <a href={l.url} target="_blank" rel="noreferrer">{l.url}</a>
                  <button type="button" onClick={() => removeLink(l.url)} style={{ marginLeft: 8 }}>remove</button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div style={{ marginTop: 20 }}>
          {submitError && <p role="alert" style={{ color: "#c00", marginBottom: 8 }}> {submitError}</p>}
          <button type="submit" disabled={submitting} style={{ opacity: submitting ? 0.6 : 1 }}>
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </form>
    </main>
  );
}