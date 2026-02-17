/**
 * Client-side decay calculation.
 *
 * Mirrors the Python decay engine so the mobile app can compute
 * health locally without hitting the sidecar on every render.
 * Formula: N(t) = N₀ · e^(−λ · t)
 */

import type { HealthStatus } from "@/types/garden";

const THRESHOLDS = {
  THRIVING: 0.7,
  COOLING: 0.4,
  DORMANT: 0.1,
} as const;

export function calculateHealth(
  lastInteractionAt: string,
  decayRate: number,
  now: Date = new Date()
): number {
  const last = new Date(lastInteractionAt);
  const daysElapsed = Math.max(
    0,
    (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
  );
  const health = Math.exp(-decayRate * daysElapsed);
  return Math.max(0, Math.min(1, health));
}

export function classifyStatus(healthScore: number): HealthStatus {
  if (healthScore >= THRESHOLDS.THRIVING) return "thriving";
  if (healthScore >= THRESHOLDS.COOLING) return "cooling";
  if (healthScore >= THRESHOLDS.DORMANT) return "at_risk";
  return "dormant";
}

export function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}
