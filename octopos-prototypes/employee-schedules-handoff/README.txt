OCTOPOS EMPLOYEE SCHEDULES — DESIGN HANDOFF V5
Prepared 12 November 2026

Open index.html through GitHub Pages or a local HTTP server.
Use Developer handoff at the bottom-right for the source-ticket audit,
behavior rules, state matrix, data contracts and integration limitations.
Use Demo controls for 5/12/24/72 employees, short shifts, staggered starts,
empty/error/loading states, permissions and historical changes.

DEMO CLOCK
Tuesday 10 November 2026 at 1:30 PM, America/Phoenix. All records are fictional.
This is a fixed design fixture, not a live workforce dashboard.

SOURCE
index.html — entry point
styles.css — visual tokens, responsive/sticky layout and print styles
model.js — shared fixtures, interval math, grouping and validation
app.js — Week, Day, Table, shared dialogs and interactions
handoff.js — ticket audit and explicit design refinements

VERIFICATION
These sources match the tested standalone HTML, with 77/77 local checks:
46 domain checks and 31 browser checks. The downloadable developer package
provided in the conversation includes the test scripts, results and previews.
Browser tests mounted the inline source in Chromium; navigation restrictions
required an in-memory adapter for the storage-remount test. Verify actual
origin persistence, accessibility and API integration in production.

HANDOFF BOUNDARY
This is an editable design reference, not production payroll or scheduling
software. Reuse existing OctoPOS Manage Shift and Time Card components and
endpoints. Verify full location/week data rather than a paginated table page,
server authorization, time zone/DST, concurrent edits, historical membership,
and payroll classifications. Only schedule color is proposed as a new domain
field; the other records describe the existing data needed by the calendar.

EXPLICIT REFINEMENTS
Short shifts retain their accurate duration; full labels move outside them.
Large groups use an avatar subset +N, with all people in the group popup.
Coverage gaps use exact intervals within opening hours, not hourly buckets.
Attendance flags differ from pending manager reviews.
Historical shifts open Time Cards and cannot delete the historical schedule.
All calendar totals are planned; recorded actuals remain in Time Cards.
Employee report timestamps are not treated as confirmed finish times.

Edits and colors are saved only in this browser; Reset demo restores fixtures.
No real employee records, credentials, API integration or authentication.
