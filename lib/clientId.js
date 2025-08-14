export const isBrowser = () => typeof window !== "undefined";

export function getClientId() {
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
}

export function ensureClientId() {
  return getClientId();
}