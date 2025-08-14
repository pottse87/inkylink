import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

const isBrowser = () => typeof window !== "undefined";
const getClientId = () => {
  if (!isBrowser()) return null;
  try {
    let cid = localStorage.getItem("inkylink_client_id");
    if (!cid) {
      cid = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      );
      localStorage.setItem("inkylink_client_id", cid);
    }
    return cid;
  } catch {
    return null;
  }
};

export default function PaymentSuccess() {
  const router = useRouter();
  const [count, setCount] = useState(5);

  const buildDest = () => {
    const q = router?.query || {};
    const client_id = String(q.client_id || "") || getClientId() || "";
    const order_id = q.order_id ? String(q.order_id) : "";
    const session_id = q.session_id ? String(q.session_id) : "";
    const params = new URLSearchParams();
    if (client_id) params.set("client_id", client_id);
    if (order_id) params.set("order_id", order_id);
    if (session_id) params.set("session_id", session_id);
    return "/forms" + (params.toString() ? "?" + params.toString() : "");
  };

  useEffect(() => {
    let t1, t2;
    t1 = setInterval(() => setCount((c) => (c > 0 ? c - 1 : 0)), 1000);
    t2 = setTimeout(() => router.push(buildDest()), 5000);
    return () => { clearInterval(t1); clearTimeout(t2); };
  }, [router.query]);

  const onContinue = () => router.push(buildDest());

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
        <title>Payment Success</title>
      </Head>

      <h1 style={{ marginBottom: 12 }}>Thanks for your order!</h1>
      <p style={{ marginBottom: 16 }}>
        We&apos;ll gather your info and get your files uploaded shortly.
      </p>

      <p aria-live="polite" style={{ marginBottom: 16 }}>
        Redirecting to your intake form in {count} second{count === 1 ? "" : "s"}…
      </p>

      <button onClick={onContinue} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #ccc" }}>
        Continue now
      </button>
    </main>
  );
}