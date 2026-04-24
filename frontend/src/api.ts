import { API } from "./theme";

async function req(path: string, init?: RequestInit) {
  const res = await fetch(`${API}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

export const api = {
  children: () => req("/children"),
  dashboard: (id: string) => req(`/children/${id}/dashboard`),
  locations: (id: string) => req(`/children/${id}/locations`),
  geofences: (id: string) => req(`/children/${id}/geofences`),
  createGeofence: (body: any) =>
    req(`/geofences`, { method: "POST", body: JSON.stringify(body) }),
  deleteGeofence: (id: string) =>
    req(`/geofences/${id}`, { method: "DELETE" }),
  apps: (id: string) => req(`/children/${id}/apps`),
  toggleBlock: (appId: string, blocked: boolean) =>
    req(`/apps/${appId}/block`, {
      method: "PATCH",
      body: JSON.stringify({ blocked }),
    }),
  screenTime: (id: string) => req(`/children/${id}/screen-time`),
  setLimit: (id: string, limit_minutes: number) =>
    req(`/children/${id}/screen-time`, {
      method: "PATCH",
      body: JSON.stringify({ limit_minutes }),
    }),
  alerts: (id: string) => req(`/children/${id}/alerts`),
  markRead: (alertId: string) =>
    req(`/alerts/${alertId}/read`, { method: "PATCH" }),
  readAll: (id: string) =>
    req(`/children/${id}/alerts/read-all`, { method: "PATCH" }),
};

export function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
