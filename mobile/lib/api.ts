/**
 * API client for the Python Intelligence Sidecar.
 *
 * Only used for decay calculations and ML features.
 * Regular CRUD goes through Supabase directly.
 */

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface RefreshResult {
  user_id: string;
  contacts_updated: number;
  avg_health: number;
  refreshed_at: string;
}

export async function refreshGarden(userId: string): Promise<RefreshResult> {
  const res = await fetch(`${API_BASE}/refresh-garden`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!res.ok) {
    throw new Error(`Failed to refresh garden: ${res.status}`);
  }

  return res.json();
}

export async function fetchGarden(userId: string) {
  const res = await fetch(`${API_BASE}/garden/${userId}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch garden: ${res.status}`);
  }

  return res.json();
}

export async function waterPlant(
  contactId: string,
  userId: string,
  type: string = "other",
  notes?: string
) {
  const res = await fetch(`${API_BASE}/water/${contactId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contact_id: contactId,
      user_id: userId,
      type,
      notes,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to water plant: ${res.status}`);
  }

  return res.json();
}
