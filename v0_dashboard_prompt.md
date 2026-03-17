# v0 Dashboard Prompt — Copy and paste everything below into v0.dev

Build a professional speaker lead management dashboard for SpeakerAgent.AI using Next.js, TypeScript, and shadcn/ui. The app manages speaking engagement leads found by an AI scout agent.

ENVIRONMENT VARIABLE:
- NEXT_PUBLIC_API_URL — the backend API base URL (e.g., "https://speakeragent-api-production.up.railway.app")

PAGE STRUCTURE: Single-page dashboard with a sidebar and main content area.

SIDEBAR (left, narrow, collapsible):
- SpeakerAgent.AI logo/text at top
- Navigation items: "Dashboard" (home icon), "All Leads" (list icon), "Settings" (gear icon)
- At the bottom: speaker name "Dr. Leigh Vinocur" and a small avatar placeholder

MAIN CONTENT has 3 views:

---

VIEW 1: DASHBOARD (default view, path: /)

Top row: 4 stat cards in a grid
- Card 1: "Total Leads" — large number, subtext "all time"
- Card 2: "Hot Leads" — large number in RED (#dc2626), fire emoji, subtext "score >= 65"
- Card 3: "Warm Leads" — large number in AMBER (#d97706), subtext "score 35-64"
- Card 4: "Avg Score" — large number with "/100" suffix

Fetch stats from: GET {NEXT_PUBLIC_API_URL}/api/leads/stats?speaker_id=leigh_vinocur
Response shape:
```json
{
  "total": number,
  "by_triage": {"RED": number, "YELLOW": number, "GREEN": number},
  "by_status": {"New": number, "Contacted": number},
  "avg_score": number
}
```

Below stats: "Top Leads" section showing the 5 highest-scored leads as cards.
Fetch from: GET {NEXT_PUBLIC_API_URL}/api/dashboard/leigh_vinocur
Response shape:
```json
{
  "speaker": {"id": "string", "full_name": "string"},
  "stats": {"total": 21, "by_triage": {"RED": 16, "YELLOW": 5, "GREEN": 0}, "avg_score": 71.9},
  "top_leads": [
    {
      "id": "recXXX",
      "Conference Name": "AMGA Annual Conference 2026",
      "Lead Triage": "RED",
      "Match Score": 86,
      "Event Location": "Las Vegas, NV",
      "The Hook": "Healthcare leadership demands split-second decisions...",
      "Lead Status": "New",
      "Conference URL": "https://www.amga.org/2026-annual-conference",
      "Suggested Talk": "Never Let Them See You Sweat: Performing Under Pressure",
      "Pay Estimate": "$3,000 - $10,000"
    }
  ]
}
```

Each top lead card shows:
- Left: colored dot (red/amber/green) based on Lead Triage
- Conference Name (bold)
- Score badge (e.g., "86/100")
- Location and Suggested Talk
- Status badge (colored pill: New=blue, Contacted=purple, Replied=amber, Booked=green, Passed=gray)
- Clicking the card opens the detail view

---

VIEW 2: ALL LEADS (path: /leads)

A data table (shadcn Table component) showing all leads.
Fetch from: GET {NEXT_PUBLIC_API_URL}/api/leads?speaker_id=leigh_vinocur
Response shape:
```json
{
  "count": 21,
  "leads": [
    {
      "id": "recXXX",
      "Conference Name": "AMGA Annual Conference 2026",
      "Lead Triage": "RED",
      "Match Score": 86,
      "Event Location": "Las Vegas, NV",
      "Event Date": "2026-04-15T00:00:00.000Z",
      "The Hook": "Healthcare leadership demands split-second decisions...",
      "CTA": "I'd welcome a 15-minute call to discuss...",
      "Lead Status": "New",
      "Conference URL": "https://www.amga.org/2026-annual-conference",
      "Contact Email": "info@amga.org",
      "Suggested Talk": "Never Let Them See You Sweat: Performing Under Pressure",
      "Date Found": "2026-02-22T00:00:00.000Z",
      "speaker_id": "leigh_vinocur",
      "Pay Estimate": "$3,000 - $10,000"
    }
  ]
}
```

Table columns:
1. Triage — colored dot (RED=#dc2626, YELLOW=#d97706, GREEN=#16a34a)
2. Conference Name — bold, truncated to 40 chars
3. Score — number with /100
4. Topic — the Suggested Talk field
5. Location — text
6. Status — dropdown pill that can be changed (New, Contacted, Replied, Booked, Passed)
7. Date Found — formatted date

When status dropdown changes, call:
PUT {NEXT_PUBLIC_API_URL}/api/leads/{id}/status
Body: {"status": "Contacted"}

Above the table: filter bar with:
- Triage filter (All, RED, YELLOW, GREEN) as toggle buttons
- Status filter dropdown
- Sort by: Score (default desc), Date Found

Table rows should be clickable — clicking opens the lead detail view.

---

VIEW 3: LEAD DETAIL (shown as a slide-over panel or modal when a lead is clicked)

Fetch from: GET {NEXT_PUBLIC_API_URL}/api/leads/{id}
Response: same shape as individual lead object above.

Panel layout:
- Header: Conference Name, colored triage badge, score
- Status selector (radio buttons or dropdown) — updates via PUT on change
- Section "The Hook": displays the AI-generated pitch text in a styled quote block
- Section "CTA": the call-to-action text
- Section "Details": Event Date, Event Location, Suggested Talk, Pay Estimate
- Section "Contact": Contact Email (as mailto link), Conference URL (as external link)
- Button row: "Open Conference Website" (external link), "Copy Hook" (copies hook to clipboard), "Mark Contacted" (shortcut to update status)

---

DESIGN SYSTEM:
- Dark navy sidebar (#1e293b), white main content
- Font: Inter or system font stack
- Triage colors: RED=#dc2626, YELLOW/AMBER=#d97706, GREEN=#16a34a
- Status badge colors: New=#3b82f6 (blue), Contacted=#8b5cf6 (purple), Replied=#d97706 (amber), Booked=#16a34a (green), Passed=#6b7280 (gray)
- Use shadcn/ui Card, Table, Badge, Button, Select, Sheet (for slide-over) components
- Responsive: works on desktop and tablet
- Loading states: skeleton loaders while fetching data
- Error state: show a friendly message if API calls fail

SPEAKER_ID:
Hardcode "leigh_vinocur" as the speaker_id for now. Later this will come from auth.

Make all API calls use the NEXT_PUBLIC_API_URL environment variable. Never hardcode the backend URL.
