export function getClientId() {
  if (typeof window === "undefined") return null;
  let cid = localStorage.getItem("inkylink_client_id");
  if (!cid || cid.length < 8) {
    try {
      cid = (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : `cid_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    } catch {
      cid = `cid_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    }
    // IMPORTANT: persist it
    localStorage.setItem("inkylink_client_id", cid);
  }
  return cid;
}

export function ensureCidInUrl() {
  if (typeof window === "undefined") return null;
  const cid = getClientId();
  const qs = new URLSearchParams(window.location.search);
  if (!qs.get("client_id") && cid) {
    qs.set("client_id", cid);
    const next = `${window.location.pathname}?${qs.toString()}`;
    window.history.replaceState({}, "", next);
  }
  return cid;
}
