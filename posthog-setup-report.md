# PostHog Analytics Setup Report

**Date:** 2026-03-25
**Project:** michelle-liu portfolio
**PostHog Project ID:** 357336
**Dashboard:** [Analytics basics](https://us.posthog.com/project/357336/dashboard/1400409)

---

## Events Instrumented

| Event | File | Properties |
|---|---|---|
| `project_opened` | `src/App.tsx` | `project_id`, `view_mode` |
| `project_closed` | `src/components/project/ProjectModal.tsx` | `project_id` |
| `project_expanded_fullscreen` | `src/components/project/ProjectModal.tsx` | `project_id` |
| `protected_content_unlocked` | `src/components/project/ProjectModal.tsx` | `project_id` |
| `skip_to_final_designs_clicked` | `src/components/project/ProjectModal.tsx` | `project_id` |
| `book_filter_changed` | `src/components/library/LibraryPage.tsx` | `filter` |
| `book_viewed` | `src/components/library/LibraryPage.tsx` | `book_title`, `book_rating`, `book_year`, `is_favorite` |
| `book_suggestion_submitted` | `src/components/library/AddBookModal.tsx` | `title_length` |
| `contact_link_clicked` | `src/components/ContactBadge.tsx` | _(none)_ |
| `try_it_out_clicked` | `src/components/TryItOutButton.tsx` | `href` |

---

## Dashboard & Insights

**Dashboard:** [Analytics basics](https://us.posthog.com/project/357336/dashboard/1400409)

| Insight | URL |
|---|---|
| Project engagement over time | https://us.posthog.com/project/357336/insights/dBKMU5QW |
| Project engagement funnel | https://us.posthog.com/project/357336/insights/qIUzyFfs |
| Library activity | https://us.posthog.com/project/357336/insights/fR1Du2PZ |

---

## Environment Variables

Set in `.env` (gitignored):

```
VITE_PUBLIC_POSTHOG_KEY=<your key>
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

---

## Implementation Notes

- PostHog is initialized in `src/main.tsx` via `initPostHog()`
- All capture calls are guarded with `posthogEnabled` to no-op when the key is absent
- `book_suggestion_submitted` uses `title_length` instead of the actual title to avoid capturing PII
- `person_profiles: "identified_only"` — no anonymous person profiles are created
- Pageview autocapture is disabled (`capture_pageview: false`); page navigation is tracked via Vercel Analytics
