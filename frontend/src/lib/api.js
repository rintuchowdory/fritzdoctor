const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  health: () => request("/api/health"),
  status: () => request("/api/status"),
  devices: () => request("/api/devices"),
  wlan: () => request("/api/wlan"),
  ping: (host = "8.8.8.8") => request(`/api/ping?host=${encodeURIComponent(host)}`),
  speedtest: () => request("/api/speedtest"),
  setChannel: (service_index, channel) =>
    request("/api/wlan/channel", {
      method: "POST",
      body: JSON.stringify({ service_index, channel }),
    }),
  toggleGuestWifi: (enable) =>
    request("/api/wlan/guest", {
      method: "POST",
      body: JSON.stringify({ enable }),
    }),
  reboot: () => request("/api/reboot", { method: "POST" }),
};
