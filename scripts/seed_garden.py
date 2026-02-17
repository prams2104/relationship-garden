"""
Mock Data Seeder — Relationship Garden

Seeds 50 contacts in various states of decay so you can visualize
the "Garden" immediately without manual entry.

Usage:
    python scripts/seed_garden.py

Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment
or in backend/.env.
"""

import os
import sys
import random
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Allow importing from backend
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / "backend" / ".env")

from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
    print("  Copy backend/.env.example → backend/.env and fill in values.")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ============================================================
# Fake contact data — diverse network for a UCSD EE/ML student
# ============================================================

CONTACTS = [
    # --- ORCHID (high-touch, fast decay) ---
    {"name": "Sarah Chen", "tier": "orchid", "company": "Deloitte", "title": "Partner", "tags": ["mentor", "consulting"]},
    {"name": "Mom", "tier": "orchid", "company": None, "title": None, "tags": ["family"]},
    {"name": "Dad", "tier": "orchid", "company": None, "title": None, "tags": ["family"]},
    {"name": "Priya Sharma", "tier": "orchid", "company": "Jane Street", "title": "Quant Researcher", "tags": ["mentor", "quant"]},
    {"name": "James Liu", "tier": "orchid", "company": "UCSD", "title": "Professor — ECE", "tags": ["mentor", "academic"]},
    {"name": "Maya Rodriguez", "tier": "orchid", "company": None, "title": None, "tags": ["partner", "personal"]},
    {"name": "David Kim", "tier": "orchid", "company": "Citadel", "title": "VP", "tags": ["mentor", "quant"]},
    {"name": "Aisha Patel", "tier": "orchid", "company": "McKinsey", "title": "Associate", "tags": ["mentor", "consulting"]},

    # --- FERN (medium-touch, standard decay) ---
    {"name": "Alex Thompson", "tier": "fern", "company": "Google", "title": "SWE L5", "tags": ["friend", "tech"]},
    {"name": "Emily Wang", "tier": "fern", "company": "UCSD", "title": "PhD Student", "tags": ["friend", "academic"]},
    {"name": "Carlos Mendez", "tier": "fern", "company": "Tesla", "title": "ML Engineer", "tags": ["friend", "ml"]},
    {"name": "Rachel Green", "tier": "fern", "company": "Stripe", "title": "PM", "tags": ["friend", "tech"]},
    {"name": "Kevin Park", "tier": "fern", "company": None, "title": None, "tags": ["friend", "ucsd"]},
    {"name": "Sophia Lee", "tier": "fern", "company": "NVIDIA", "title": "Research Scientist", "tags": ["peer", "ml"]},
    {"name": "Nathan Wright", "tier": "fern", "company": "Meta", "title": "MLE", "tags": ["peer", "tech"]},
    {"name": "Isabella Martinez", "tier": "fern", "company": "Apple", "title": "Design Lead", "tags": ["friend", "design"]},
    {"name": "Ryan O'Connor", "tier": "fern", "company": "Palantir", "title": "Forward Deployed Engineer", "tags": ["friend", "tech"]},
    {"name": "Lily Tanaka", "tier": "fern", "company": "UCSD", "title": "TA — CSE 151B", "tags": ["peer", "academic"]},
    {"name": "Omar Hassan", "tier": "fern", "company": "Two Sigma", "title": "SWE", "tags": ["friend", "quant"]},
    {"name": "Grace Liu", "tier": "fern", "company": "Notion", "title": "Product Designer", "tags": ["friend", "startup"]},
    {"name": "Ethan Brooks", "tier": "fern", "company": "UCSD", "title": "MBA Student", "tags": ["friend", "business"]},
    {"name": "Nadia Volkov", "tier": "fern", "company": "Anthropic", "title": "Research Engineer", "tags": ["peer", "ai"]},

    # --- BONSAI (professional, moderate decay) ---
    {"name": "Michael Zhang", "tier": "bonsai", "company": "a16z", "title": "Partner", "tags": ["investor", "vc"]},
    {"name": "Jennifer Wu", "tier": "bonsai", "company": "LinkedIn", "title": "Recruiter", "tags": ["recruiter", "tech"]},
    {"name": "Robert Taylor", "tier": "bonsai", "company": "Sequoia", "title": "Associate", "tags": ["investor", "vc"]},
    {"name": "Amanda Foster", "tier": "bonsai", "company": "Bain", "title": "Senior Associate", "tags": ["consulting", "professional"]},
    {"name": "Daniel Park", "tier": "bonsai", "company": "Goldman Sachs", "title": "VP — Tech", "tags": ["professional", "finance"]},
    {"name": "Christine Lee", "tier": "bonsai", "company": "Y Combinator", "title": "Partner", "tags": ["investor", "startup"]},
    {"name": "Andrew Nguyen", "tier": "bonsai", "company": "Scale AI", "title": "CTO", "tags": ["founder", "ai"]},
    {"name": "Michelle Santos", "tier": "bonsai", "company": "UCSD Career Center", "title": "Director", "tags": ["professional", "academic"]},
    {"name": "Thomas Moore", "tier": "bonsai", "company": "BCG", "title": "Consultant", "tags": ["consulting", "professional"]},
    {"name": "Lisa Chang", "tier": "bonsai", "company": "OpenAI", "title": "Recruiter", "tags": ["recruiter", "ai"]},

    # --- SUCCULENT (low-touch, slow decay) ---
    {"name": "Brian Miller", "tier": "succulent", "company": "Amazon", "title": "SDE II", "tags": ["acquaintance", "tech"]},
    {"name": "Jessica Huang", "tier": "succulent", "company": "Netflix", "title": "Data Scientist", "tags": ["acquaintance", "tech"]},
    {"name": "Marcus Johnson", "tier": "succulent", "company": None, "title": None, "tags": ["gym_buddy", "personal"]},
    {"name": "Samantha Reed", "tier": "succulent", "company": "Microsoft", "title": "PM", "tags": ["acquaintance", "tech"]},
    {"name": "Tyler Chen", "tier": "succulent", "company": "UCSD", "title": "Undergrad", "tags": ["classmate", "academic"]},
    {"name": "Olivia Brown", "tier": "succulent", "company": "Airbnb", "title": "SWE", "tags": ["acquaintance", "tech"]},
    {"name": "Jake Williams", "tier": "succulent", "company": None, "title": None, "tags": ["high_school", "personal"]},
    {"name": "Hannah Kim", "tier": "succulent", "company": "Uber", "title": "ML Engineer", "tags": ["acquaintance", "ml"]},
    {"name": "Chris Evans", "tier": "succulent", "company": "SpaceX", "title": "Engineer", "tags": ["acquaintance", "aerospace"]},
    {"name": "Angela Davis", "tier": "succulent", "company": "Adobe", "title": "UX Researcher", "tags": ["acquaintance", "design"]},
    {"name": "Sean Murphy", "tier": "succulent", "company": None, "title": None, "tags": ["army", "personal"]},
    {"name": "Diana Torres", "tier": "succulent", "company": "Salesforce", "title": "SWE", "tags": ["acquaintance", "tech"]},
    {"name": "Paul Anderson", "tier": "succulent", "company": "UCSD", "title": "Alumni", "tags": ["alumni", "academic"]},
    {"name": "Megan White", "tier": "succulent", "company": "Snapchat", "title": "iOS Engineer", "tags": ["acquaintance", "tech"]},
    {"name": "Victor Reyes", "tier": "succulent", "company": "AMD", "title": "Hardware Engineer", "tags": ["classmate", "ee"]},
    {"name": "Zoe Mitchell", "tier": "succulent", "company": "Pinterest", "title": "Data Analyst", "tags": ["acquaintance", "tech"]},
    {"name": "Nick Petrov", "tier": "succulent", "company": None, "title": None, "tags": ["travel", "personal"]},
    {"name": "Laura Kim", "tier": "succulent", "company": "Databricks", "title": "Solutions Architect", "tags": ["acquaintance", "data"]},
]

# Decay rates per tier
DECAY_RATES = {
    "orchid": 0.0495,
    "fern": 0.0231,
    "bonsai": 0.0116,
    "succulent": 0.0077,
}

# Days-ago ranges per tier (to create realistic variety)
DAYS_AGO_RANGES = {
    "orchid":    (0, 45),     # Some fresh, some neglected
    "fern":      (0, 90),     # Wider range
    "bonsai":    (5, 120),    # Professional cadence
    "succulent": (10, 200),   # Low maintenance, long gaps OK
}

# Interaction counts (more = more mature plants)
INTERACTION_RANGES = {
    "orchid":    (5, 60),
    "fern":      (2, 30),
    "bonsai":    (1, 20),
    "succulent": (0, 10),
}

# Growth stage based on interaction count
def get_growth_stage(total: int) -> str:
    if total >= 50:
        return "ancient"
    elif total >= 25:
        return "mature"
    elif total >= 10:
        return "sapling"
    elif total >= 3:
        return "sprout"
    return "seed"


def seed(user_id: str):
    """Seed 50 contacts for a given user with realistic decay states."""

    now = datetime.now(timezone.utc)
    print(f"\nSeeding {len(CONTACTS)} contacts for user {user_id}...")
    print(f"Current time: {now.isoformat()}\n")

    # Clear existing contacts for this user (idempotent re-runs)
    supabase.table("interactions").delete().eq("user_id", user_id).execute()
    supabase.table("contacts").delete().eq("user_id", user_id).execute()
    print("  Cleared existing data.")

    import math

    for i, c in enumerate(CONTACTS):
        tier = c["tier"]
        decay_rate = DECAY_RATES[tier] * random.uniform(0.8, 1.2)  # ±20% variance

        # Random last interaction
        min_days, max_days = DAYS_AGO_RANGES[tier]
        days_ago = random.uniform(min_days, max_days)
        last_interaction = now - timedelta(days=days_ago)

        # Calculate current health
        health = math.exp(-decay_rate * days_ago)
        health = max(0.0, min(1.0, round(health, 4)))

        # Random interaction count and derived growth stage
        min_int, max_int = INTERACTION_RANGES[tier]
        total_interactions = random.randint(min_int, max_int)
        growth_stage = get_growth_stage(total_interactions)

        # A few favorites
        is_favorite = i < 5 or random.random() < 0.1

        contact_data = {
            "user_id": user_id,
            "name": c["name"],
            "email": f"{c['name'].lower().replace(' ', '.')}@example.com",
            "company": c.get("company"),
            "title": c.get("title"),
            "tier": tier,
            "growth_stage": growth_stage,
            "tags": c.get("tags", []),
            "last_interaction_at": last_interaction.isoformat(),
            "health_score": health,
            "decay_rate": round(decay_rate, 4),
            "total_interactions": total_interactions,
            "is_favorite": is_favorite,
            "is_archived": False,
        }

        resp = supabase.table("contacts").insert(contact_data).execute()
        contact_id = resp.data[0]["id"]

        # Add some sample interactions for realism
        num_sample_interactions = min(total_interactions, 3)
        for j in range(num_sample_interactions):
            interaction_days_ago = days_ago + random.uniform(0, 30) * (j + 1)
            interaction_time = now - timedelta(days=interaction_days_ago)

            interaction_types = ["text", "call", "email", "meeting", "coffee", "video_call"]
            weights = {
                "orchid": [0.3, 0.3, 0.1, 0.1, 0.1, 0.1],
                "fern": [0.4, 0.1, 0.2, 0.1, 0.1, 0.1],
                "bonsai": [0.1, 0.1, 0.4, 0.2, 0.1, 0.1],
                "succulent": [0.5, 0.1, 0.1, 0.1, 0.1, 0.1],
            }

            itype = random.choices(interaction_types, weights=weights[tier])[0]

            sample_notes = [
                "Quick catch-up, all good.",
                "Discussed career plans.",
                "Shared some interesting links.",
                "Met for coffee near campus.",
                "Had a great video call.",
                "They mentioned a new project.",
                "Talked about upcoming conference.",
                None,
            ]

            # Insert interaction WITHOUT triggering the health reset
            # (we've already set health manually for seed variety)
            supabase.rpc("seed_interaction", {
                "p_contact_id": contact_id,
                "p_user_id": user_id,
                "p_type": itype,
                "p_source": "manual",
                "p_notes": random.choice(sample_notes),
                "p_happened_at": interaction_time.isoformat(),
            }).execute()

        status = "thriving" if health >= 0.7 else "cooling" if health >= 0.4 else "at_risk" if health >= 0.1 else "dormant"
        bar = "█" * int(health * 20) + "░" * (20 - int(health * 20))
        print(f"  [{bar}] {health:.2f} {status:<10} {c['name']:<25} ({tier})")

    print(f"\nDone! Seeded {len(CONTACTS)} contacts.")
    print("  Run the app to see your garden.\n")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/seed_garden.py <user_id>")
        print("  user_id = your Supabase auth.users UUID")
        sys.exit(1)

    seed(sys.argv[1])
