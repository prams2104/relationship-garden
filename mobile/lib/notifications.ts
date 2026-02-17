import * as Notifications from "expo-notifications";
import { supabase } from "./supabase";
import { calculateHealth, classifyStatus } from "./decay";
import type { Contact } from "@/types/garden";

/**
 * Garden notification scheduler.
 *
 * Scheduling strategy:
 *   - Morning nudge at 8:00 AM local time daily
 *   - Copy is warm and specific: "3 plants in your Mentor circle are cooling"
 *     NOT "You have 5 tasks" (per product spec)
 *   - Max 1 notification per day to avoid guilt spirals
 *   - Tapping the notification deep-links to the most urgent contact
 */

const MORNING_HOUR = 8;
const MORNING_MINUTE = 0;

/**
 * Schedule the daily "garden review" nudge.
 *
 * Cancels any existing scheduled nudges first (idempotent).
 * Queries Supabase for contacts needing attention, then
 * schedules a local notification for 8 AM tomorrow.
 */
export async function scheduleGardenNudge(userId: string) {
  // Cancel previous garden nudges
  await cancelGardenNudges();

  // Fetch contacts that need attention
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, name, tier, last_interaction_at, decay_rate")
    .eq("user_id", userId)
    .eq("is_archived", false);

  if (!contacts || contacts.length === 0) return;

  const now = new Date();
  const needsAttention: { id: string; name: string; tier: string; health: number }[] = [];

  for (const c of contacts as Contact[]) {
    const health = calculateHealth(c.last_interaction_at, c.decay_rate, now);
    const status = classifyStatus(health);
    if (status === "at_risk" || status === "dormant") {
      needsAttention.push({ id: c.id, name: c.name, tier: c.tier, health });
    }
  }

  if (needsAttention.length === 0) {
    // Garden is healthy — schedule an encouraging nudge
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Your garden is flourishing",
        body: "All relationships are healthy. Nice work being intentional.",
        data: {},
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: MORNING_HOUR,
        minute: MORNING_MINUTE,
      },
    });
    return;
  }

  // Sort by health (most urgent first)
  needsAttention.sort((a, b) => a.health - b.health);

  // Build notification copy — warm, specific, not guilt-inducing
  const { title, body } = buildNudgeCopy(needsAttention);
  const mostUrgent = needsAttention[0];

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { contactId: mostUrgent.id, type: "garden_nudge" },
      sound: "default",
      badge: Math.min(needsAttention.length, 9),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: MORNING_HOUR,
      minute: MORNING_MINUTE,
    },
  });
}

/**
 * Schedule a one-time nudge for testing (fires in `seconds`).
 */
export async function scheduleTestNudge(userId: string, seconds: number = 5) {
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, name, tier, last_interaction_at, decay_rate")
    .eq("user_id", userId)
    .eq("is_archived", false);

  if (!contacts) return;

  const now = new Date();
  const needsAttention: { id: string; name: string; tier: string; health: number }[] = [];

  for (const c of contacts as Contact[]) {
    const health = calculateHealth(c.last_interaction_at, c.decay_rate, now);
    const status = classifyStatus(health);
    if (status === "at_risk" || status === "dormant") {
      needsAttention.push({ id: c.id, name: c.name, tier: c.tier, health });
    }
  }

  needsAttention.sort((a, b) => a.health - b.health);
  const { title, body } = buildNudgeCopy(needsAttention);
  const mostUrgent = needsAttention[0];

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: mostUrgent ? { contactId: mostUrgent.id, type: "garden_nudge" } : {},
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
}

/**
 * Cancel all scheduled garden nudges.
 */
export async function cancelGardenNudges() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Build warm, specific notification copy.
 *
 * Terminology from the product spec:
 *   - "cooling" not "thirsty"
 *   - "needs attention" not "you failed"
 *   - Include names for personal connection
 *   - Cap at 3 mentions to avoid overwhelm
 */
function buildNudgeCopy(
  plants: { name: string; tier: string; health: number }[]
): { title: string; body: string } {
  const count = plants.length;

  if (count === 0) {
    return {
      title: "Your garden is flourishing",
      body: "All relationships are healthy today.",
    };
  }

  if (count === 1) {
    const p = plants[0];
    const tierLabel = TIER_LABELS[p.tier] ?? "relationship";
    return {
      title: `${p.name} could use a check-in`,
      body: `Your ${tierLabel} connection is cooling. A quick message goes a long way.`,
    };
  }

  if (count <= 3) {
    const names = plants.map((p) => p.name).join(", ");
    return {
      title: `${count} plants need attention`,
      body: `${names} — a quick check-in keeps relationships warm.`,
    };
  }

  // More than 3 — name top 2, summarize rest
  const top2 = plants.slice(0, 2).map((p) => p.name).join(", ");
  const rest = count - 2;
  return {
    title: `${count} plants need attention`,
    body: `${top2} and ${rest} other${rest > 1 ? "s" : ""} are cooling. 2-minute garden review?`,
  };
}

const TIER_LABELS: Record<string, string> = {
  orchid: "close",
  fern: "friend",
  bonsai: "professional",
  succulent: "casual",
};
