/**
 * Client-side mock data for immediate garden visualization.
 *
 * This mirrors the 50-contact seed script but lives in the mobile app
 * so you can see the garden grid without a backend connection.
 * Replace with real Supabase queries once the backend is wired.
 */

import type { PlantData, HealthStatus } from "@/types/garden";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function health(daysElapsed: number, lambda: number): number {
  return Math.max(0, Math.min(1, Math.exp(-lambda * daysElapsed)));
}

function status(h: number): HealthStatus {
  if (h >= 0.7) return "thriving";
  if (h >= 0.4) return "cooling";
  if (h >= 0.1) return "at_risk";
  return "dormant";
}

type PlantSeed = {
  name: string;
  tier: PlantData["tier"];
  daysElapsed: number;
  interactions: number;
  tags: string[];
  favorite?: boolean;
};

const seeds: PlantSeed[] = [
  // Orchid (λ ≈ 0.0495) — high-touch
  { name: "Sarah Chen", tier: "orchid", daysElapsed: 2, interactions: 35, tags: ["mentor", "consulting"], favorite: true },
  { name: "Mom", tier: "orchid", daysElapsed: 1, interactions: 55, tags: ["family"], favorite: true },
  { name: "Dad", tier: "orchid", daysElapsed: 4, interactions: 48, tags: ["family"], favorite: true },
  { name: "Priya Sharma", tier: "orchid", daysElapsed: 18, interactions: 22, tags: ["mentor", "quant"], favorite: true },
  { name: "James Liu", tier: "orchid", daysElapsed: 30, interactions: 15, tags: ["mentor", "academic"] },
  { name: "Maya Rodriguez", tier: "orchid", daysElapsed: 0, interactions: 60, tags: ["partner"], favorite: true },
  { name: "David Kim", tier: "orchid", daysElapsed: 25, interactions: 12, tags: ["mentor", "quant"] },
  { name: "Aisha Patel", tier: "orchid", daysElapsed: 40, interactions: 8, tags: ["mentor", "consulting"] },

  // Fern (λ ≈ 0.0231) — standard
  { name: "Alex Thompson", tier: "fern", daysElapsed: 5, interactions: 20, tags: ["friend", "tech"] },
  { name: "Emily Wang", tier: "fern", daysElapsed: 15, interactions: 18, tags: ["friend", "academic"] },
  { name: "Carlos Mendez", tier: "fern", daysElapsed: 35, interactions: 14, tags: ["friend", "ml"] },
  { name: "Rachel Green", tier: "fern", daysElapsed: 50, interactions: 10, tags: ["friend", "tech"] },
  { name: "Kevin Park", tier: "fern", daysElapsed: 8, interactions: 25, tags: ["friend", "ucsd"] },
  { name: "Sophia Lee", tier: "fern", daysElapsed: 22, interactions: 12, tags: ["peer", "ml"] },
  { name: "Nathan Wright", tier: "fern", daysElapsed: 60, interactions: 7, tags: ["peer", "tech"] },
  { name: "Isabella Martinez", tier: "fern", daysElapsed: 12, interactions: 16, tags: ["friend", "design"] },
  { name: "Ryan O'Connor", tier: "fern", daysElapsed: 45, interactions: 9, tags: ["friend", "tech"] },
  { name: "Lily Tanaka", tier: "fern", daysElapsed: 3, interactions: 22, tags: ["peer", "academic"] },
  { name: "Omar Hassan", tier: "fern", daysElapsed: 28, interactions: 11, tags: ["friend", "quant"] },
  { name: "Grace Liu", tier: "fern", daysElapsed: 70, interactions: 5, tags: ["friend", "startup"] },
  { name: "Ethan Brooks", tier: "fern", daysElapsed: 10, interactions: 13, tags: ["friend", "business"] },
  { name: "Nadia Volkov", tier: "fern", daysElapsed: 42, interactions: 8, tags: ["peer", "ai"] },

  // Bonsai (λ ≈ 0.0116) — professional
  { name: "Michael Zhang", tier: "bonsai", daysElapsed: 20, interactions: 6, tags: ["investor", "vc"] },
  { name: "Jennifer Wu", tier: "bonsai", daysElapsed: 45, interactions: 4, tags: ["recruiter", "tech"] },
  { name: "Robert Taylor", tier: "bonsai", daysElapsed: 90, interactions: 3, tags: ["investor", "vc"] },
  { name: "Amanda Foster", tier: "bonsai", daysElapsed: 30, interactions: 7, tags: ["consulting"] },
  { name: "Daniel Park", tier: "bonsai", daysElapsed: 60, interactions: 5, tags: ["finance"] },
  { name: "Christine Lee", tier: "bonsai", daysElapsed: 15, interactions: 8, tags: ["investor", "startup"] },
  { name: "Andrew Nguyen", tier: "bonsai", daysElapsed: 100, interactions: 2, tags: ["founder", "ai"] },
  { name: "Michelle Santos", tier: "bonsai", daysElapsed: 40, interactions: 6, tags: ["professional"] },
  { name: "Thomas Moore", tier: "bonsai", daysElapsed: 75, interactions: 3, tags: ["consulting"] },
  { name: "Lisa Chang", tier: "bonsai", daysElapsed: 10, interactions: 4, tags: ["recruiter", "ai"] },

  // Succulent (λ ≈ 0.0077) — low-touch
  { name: "Brian Miller", tier: "succulent", daysElapsed: 30, interactions: 5, tags: ["acquaintance", "tech"] },
  { name: "Jessica Huang", tier: "succulent", daysElapsed: 80, interactions: 3, tags: ["acquaintance", "tech"] },
  { name: "Marcus Johnson", tier: "succulent", daysElapsed: 120, interactions: 8, tags: ["gym_buddy"] },
  { name: "Samantha Reed", tier: "succulent", daysElapsed: 60, interactions: 2, tags: ["acquaintance", "tech"] },
  { name: "Tyler Chen", tier: "succulent", daysElapsed: 15, interactions: 6, tags: ["classmate"] },
  { name: "Olivia Brown", tier: "succulent", daysElapsed: 150, interactions: 1, tags: ["acquaintance", "tech"] },
  { name: "Jake Williams", tier: "succulent", daysElapsed: 200, interactions: 4, tags: ["high_school"] },
  { name: "Hannah Kim", tier: "succulent", daysElapsed: 90, interactions: 3, tags: ["acquaintance", "ml"] },
  { name: "Chris Evans", tier: "succulent", daysElapsed: 40, interactions: 2, tags: ["acquaintance"] },
  { name: "Angela Davis", tier: "succulent", daysElapsed: 110, interactions: 1, tags: ["acquaintance", "design"] },
  { name: "Sean Murphy", tier: "succulent", daysElapsed: 180, interactions: 5, tags: ["army"] },
  { name: "Diana Torres", tier: "succulent", daysElapsed: 50, interactions: 2, tags: ["acquaintance", "tech"] },
  { name: "Paul Anderson", tier: "succulent", daysElapsed: 70, interactions: 3, tags: ["alumni"] },
  { name: "Megan White", tier: "succulent", daysElapsed: 100, interactions: 1, tags: ["acquaintance", "tech"] },
  { name: "Victor Reyes", tier: "succulent", daysElapsed: 25, interactions: 4, tags: ["classmate", "ee"] },
  { name: "Zoe Mitchell", tier: "succulent", daysElapsed: 130, interactions: 2, tags: ["acquaintance"] },
  { name: "Nick Petrov", tier: "succulent", daysElapsed: 160, interactions: 1, tags: ["travel"] },
  { name: "Laura Kim", tier: "succulent", daysElapsed: 45, interactions: 3, tags: ["acquaintance", "data"] },
];

const DECAY_RATES: Record<string, number> = {
  orchid: 0.0495,
  fern: 0.0231,
  bonsai: 0.0116,
  succulent: 0.0077,
};

function growthStage(interactions: number): PlantData["growthStage"] {
  if (interactions >= 50) return "ancient";
  if (interactions >= 25) return "mature";
  if (interactions >= 10) return "sapling";
  if (interactions >= 3) return "sprout";
  return "seed";
}

export const MOCK_PLANTS: PlantData[] = seeds.map((s, i) => {
  const lambda = DECAY_RATES[s.tier];
  const h = health(s.daysElapsed, lambda);
  return {
    id: `mock-${i}`,
    name: s.name,
    tier: s.tier,
    growthStage: growthStage(s.interactions),
    healthScore: Math.round(h * 1000) / 1000,
    status: status(h),
    lastInteractionAt: daysAgo(s.daysElapsed),
    totalInteractions: s.interactions,
    isFavorite: s.favorite ?? false,
    tags: s.tags,
  };
});
