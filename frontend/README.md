# Obligation Guardian

Build the complete frontend for a professional SaaS web application called Obliqo — AI Personal Obligation Intelligence.

IMPORTANT:
This is a FRONTEND-ONLY implementation.

Do NOT build:

Backend

Database

Ollama integration

n8n workflows

Telegram integration

Gmail integration

Calendar integration

Document integration

Authentication backend

Payment system

Real financial transactions

Real banking

Real investment/SIP functionality

Real insurance functionality

Use realistic mock data and a clean frontend service abstraction so that a FastAPI backend can be connected later without redesigning the UI.

The final product must feel like a real premium SaaS product designed by an experienced product/design team.

It MUST NOT look like:

An AI-generated dashboard

A generic admin panel

A hackathon template

A collection of random cards

A generic "AI SaaS" landing page

==================================================

PRODUCT
==================================================

Product name:

OBLIQO

Product description:

AI Personal Obligation Intelligence

Core concept:

Obliqo helps users discover, understand, prioritize and act on important life obligations scattered across messages, emails, documents and calendars.

Core product flow:

Detect → Understand → Prioritize → Prepare → Protect → Act

Examples:

Insurance renewal

Electricity bill

Vehicle service

Subscription renewal

Document expiration

Appointment

Tuition/payment deadline

Warranty expiration

License renewal

Membership renewal

The user should immediately understand:

What requires attention?

Why does it matter?

When is it due?

How much money is involved?

What can I do next?

==================================================
2. DESIGN PHILOSOPHY

Design philosophy:

"Quiet Intelligence."

The product should feel:

Professional

Premium

Calm

Intelligent

Trustworthy

Human

Minimal

Financially responsible

Modern

Practical

The interface should feel closer to a carefully designed productivity/financial SaaS product than an AI dashboard.

Do not over-design.

Do not make the product visually noisy.

Prioritize information hierarchy and usability over visual effects.

==================================================
3. COLOR SYSTEM

Use a refined:

DEEP NAVY + WARM IVORY + RESTRAINED TEAL

Primary:

#0F172A

Deep Navy

Background:

#F7F7F4

Warm Off-White

Surface:

#FFFFFF

Primary Accent:

#0F766E

Deep Teal

Secondary Accent:

#14B8A6

Muted Teal

Primary Text:

#0F172A

Secondary Text:

#64748B

Borders:

#E2E8F0

Success:

#15803D

Warning:

#B45309

Critical:

#B91C1C

Muted background:

#F1F5F9

IMPORTANT:

Use colors intentionally.

Do not make every card colorful.

Priority colors should only appear on meaningful indicators, badges or small accents.

Do NOT use generic purple AI gradients.

Do NOT use neon colors.

Do NOT use large gradient text.

==================================================
4. TYPOGRAPHY

Use:

Inter

or another premium modern sans-serif.

Create a strong typography hierarchy.

Use:

Large page titles

Medium section titles

Compact labels

Clear body text

Small metadata

Avoid excessive bold text.

Do not make everything uppercase.

Use typography and whitespace rather than boxes to create hierarchy.

==================================================
5. WHAT NOT TO DO VISUALLY

DO NOT use:

Generic purple AI gradients

Excessive glassmorphism

Neon effects

Huge gradient headings

Cartoon-like rounded cards

Excessive shadows

Emoji-heavy interfaces

Random colorful charts

Excessive animations

Decorative blobs

Abstract AI graphics

AI sparkle icons everywhere

Giant dashboard statistics

Excessive badges

Cards inside cards unnecessarily

Every section enclosed in a card

Excessive pill-shaped buttons

Excessive floating elements

Generic stock illustrations

Do not make every component look rounded.

Use modest border radius around 10–14px.

Use subtle borders.

Use whitespace as a major design element.

==================================================
6. APPLICATION SHELL

Create a responsive application shell.

DESKTOP:

Left sidebar navigation.

Main content area.

Optional contextual right panel only when genuinely useful.

SIDEBAR:

OBLIQO

Navigation:

Overview
Obligations
Future Fund
Shield

Divider

Insights
Activity

Bottom:

Settings
Help

Include a compact user profile section.

Do not overpopulate the sidebar.

MOBILE:

Use a responsive bottom navigation or collapsible navigation.

The mobile experience must be intentionally designed rather than simply shrinking the desktop interface.

==================================================
7. GLOBAL DESIGN SYSTEM

Create reusable components:

Button
IconButton
Badge
PriorityBadge
ObligationCard
ObligationRow
StatusIndicator
ProgressBar
EmptyState
LoadingState
ErrorState
Modal
Drawer
Toast
ConfirmationDialog
SectionHeader
StatCard
TimelineItem
SourceBadge
AmountDisplay
DeadlineDisplay
SearchInput
FilterDropdown
SortDropdown

Use one consistent component system across the application.

Use Lucide icons.

Do not mix icon libraries or icon styles.

Use consistent:

Spacing

Typography

Border radius

Icon sizes

Button heights

Input heights

Hover states

Focus states

Animation timing

==================================================
8. MOCK DATA ARCHITECTURE

Create one centralized mock data source.

Do NOT hard-code different versions of the same obligation on different pages.

Create:

src/data/mockData.ts

Create TypeScript interfaces:

src/types/obligation.ts

Interfaces:

Obligation
FutureFund
ShieldCommitment
Notification
ActivityEvent

Use realistic data.

Create at least 10–15 obligations.

Example:

Car Insurance Renewal

Category:
Insurance

Amount:
₹8,500

Deadline:
October 5, 2026

Priority:
High

Recurrence:
Yearly

Source:
Telegram

Status:
Pending

Electricity Bill

Category:
Utilities

Amount:
₹2,450

Deadline:
Today

Priority:
Critical

Recurrence:
Monthly

Source:
Gmail

Status:
Pending

Vehicle Service

Category:
Vehicle

Amount:
₹3,000

Deadline:
October 12, 2026

Priority:
Medium

Recurrence:
Yearly

Source:
Telegram

Status:
Pending

Netflix Subscription

Category:
Subscription

Amount:
₹649

Deadline:
October 25, 2026

Priority:
Low

Recurrence:
Monthly

Source:
Gmail

Status:
Pending

Driving License Renewal

Category:
Documents

Amount:
₹1,200

Deadline:
November 3, 2026

Priority:
High

Recurrence:
Yearly

Source:
Document

Status:
Pending

Add more realistic obligations with different categories, priorities, deadlines and statuses.

Do not use lorem ipsum.

==================================================
9. FRONTEND SERVICE LAYER

Create:

src/services/api.ts

Initially use mock data.

Create functions:

api.getObligations()
api.getObligation(id)
api.createObligation(data)
api.updateObligation(id, data)
api.completeObligation(id)
api.remindObligation(id)
api.getDashboard()
api.getFutureFunds()
api.createFutureFund(data)
api.getShields()
api.activateShield(id)
api.closeShield(id)
api.getActivity()
api.getNotifications()

Keep API/service calls completely separate from UI components.

The architecture must allow the mock implementation to later be replaced with FastAPI REST APIs.

Do NOT connect to a backend now.

==================================================
10. APPLICATION STATE

Use appropriate frontend state management.

When an obligation is completed:

Update the shared mock state.

The updated status must appear everywhere:

Dashboard

Obligations

Obligation Detail

Activity

Shield

Future Fund

When Shield is activated:

Update the Shield status immediately.

When a Future Fund is created:

Display it throughout the application.

The UI should feel like a functional application rather than static screenshots.

==================================================
11. OVERVIEW / DASHBOARD

Create the main page:

Overview

Top:

Good morning

Below:

"Here's what needs your attention."

Include a compact date/context indicator.

Main summary:

"You have 3 obligations that need attention."

Do NOT create huge KPI cards.

Use meaningful information.

Summary:

Due today
2

Due this week
4

Upcoming amount
₹11,450

Then:

ATTENTION REQUIRED

Show priority obligations.

Example:

Car Insurance Renewal

Insurance · Annual

₹8,500

Due Oct 5
5 days remaining

HIGH

Source: Telegram

[View obligation]

Electricity Bill

Utilities · Monthly

₹2,450

Due today

CRITICAL

Source: Gmail

[View obligation]

Vehicle Service

Vehicle · Annual

₹3,000

Due Oct 12

MEDIUM

Source: Telegram

[View obligation]

Use small priority indicators.

Do not color entire cards.

==================================================
12. UPCOMING OBLIGATIONS

Create a clean timeline.

TODAY

Electricity Bill

OCT 5

Car Insurance Renewal

OCT 12

Vehicle Service

OCT 25

Netflix Subscription

NOV 03

Driving License Renewal

Filters:

All
Today
This Week
This Month

Use subtle timeline indicators.

==================================================
13. OBLIGATIONS PAGE

Page title:

Obligations

Subtitle:

"Everything important, in one place."

Controls:

Search

Filter:

All
Critical
High
Medium
Low
Completed

Additional filters:

Category
Source
Deadline
Status

Sort:

Nearest deadline
Highest priority
Highest amount
Recently added

DESKTOP:

Use a professional table/list.

Columns:

Obligation
Category
Deadline
Amount
Priority
Source
Status
Action

MOBILE:

Convert to well-designed cards.

Do not make the mobile table overflow horizontally unless absolutely necessary.

==================================================
14. OBLIGATION DETAIL

Create a premium detail page.

Example:

Car Insurance Renewal

HIGH PRIORITY

₹8,500

Due October 5, 2026

5 days remaining

DETAILS

Category
Insurance

Recurrence
Yearly

Source
Telegram

Created
September 29, 2026

WHY IT MATTERS

"Your insurance renewal is approaching and requires ₹8,500."

ACTIONS:

[ Prepare ]

[ Remind me ]

[ Mark complete ]

Do not imply real payment.

Include activity timeline:

Detected
Prioritized
Reminder scheduled
Shield activated
Completed

When Mark Complete is clicked:

Update mock state.

Show a subtle success toast.

Move obligation to Completed state.

==================================================
15. FUTURE FUND

Page:

Future Fund

Subtitle:

"Prepare gradually for expenses you already know are coming."

IMPORTANT:

This is a planning/simulation feature.

It is NOT:

Real investment

Real SIP

Real banking

Real payment

Financial product

Main example:

Car Insurance

Target

₹12,000

Prepared

₹8,000

Progress

67%

Remaining

₹4,000

Recommended monthly preparation

₹2,000 / month

Months remaining

2

[Start Plan]

Use an elegant progress bar.

Do not use financial trading charts.

Show upcoming financial obligations:

Insurance
₹12,000
2 months

Vehicle Service
₹3,000
1 month

Annual Subscription
₹6,000
4 months

==================================================
16. SHIELD

Page:

Obligation Shield

Subtitle:

"Protect the commitments that matter."

IMPORTANT:

This is only a prototype commitment mechanism.

It is NOT:

Real insurance

Real payment

Real money movement

Example:

Car Insurance Renewal

Potential consequence

₹30

Shield commitment

₹1

Status

Active

[View commitment]

Inactive state:

Shield inactive

"Activate a ₹1 commitment for this obligation."

[Activate Shield]

Active state:

Shield active

Completed state:

Shield closed

"Obligation completed successfully."

Use a subtle shield icon.

Avoid cartoon-like illustrations.

==================================================
17. ACTIVITY

Create a clean chronological activity timeline.

Examples:

Today · 10:32 AM

Insurance renewal detected

Today · 10:32 AM

Priority calculated: High

Today · 10:35 AM

Future Fund created

Yesterday · 6:20 PM

Electricity bill completed

Use subtle timeline markers.

==================================================
18. INSIGHTS

Create lightweight insights.

Do NOT create advanced analytics.

Show:

Upcoming financial commitments

Recurring obligations

Most common categories

Completion rate

Example:

Recurring obligations

Insurance
3 annual obligations

Subscriptions
5 monthly obligations

Documents
2 yearly obligations

Use minimal charts only where they genuinely communicate information.

==================================================
19. SETTINGS

Create:

Profile

Notification preferences

Reminder preferences

Priority preferences

Data sources

Appearance

DATA SOURCES:

Telegram
Connected

Gmail
Connected

Calendar
Coming soon

Documents
Coming soon

Do NOT implement actual integrations.

==================================================
20. NOTIFICATION CENTER

Create a notification dropdown/panel.

Examples:

High priority obligation approaching

"Car insurance is due in 5 days."

Future Fund suggestion

"Prepare ₹2,000/month for your upcoming renewal."

Completed

"Electricity bill marked complete."

Allow notifications to be marked as read.

==================================================
21. EMPTY STATES

Create professional empty states.

Example:

No obligations yet.

"Once Obliqo detects an important responsibility, it will appear here."

[Add manually]

Also create empty states for:

Future Fund

Shield

Activity

Search results

Use meaningful copy.

==================================================
22. LOADING STATES

Do NOT use generic spinning loaders everywhere.

Use:

Skeleton cards

Skeleton rows

Subtle progress indicators

For AI processing create:

Understanding your message...

Identifying the obligation...

Preparing your obligation...

Use subtle transitions.

==================================================
23. ERROR STATES

Create:

Something went wrong.

"We couldn't load your obligations right now."

[Try again]

Never expose raw API errors.

==================================================
24. MICRO-INTERACTIONS

Use subtle animations.

Examples:

Button hover

Card hover

Page transitions

Modal transitions

Toast entrance

Progress animation

Completion feedback

Sidebar transitions

Keep animations fast and subtle.

Do not use excessive motion.

==================================================
25. RESPONSIVE DESIGN

Optimize for:

Desktop:
1440px

Laptop:
1280px

Tablet:
1024px

Mobile:
390px
430px

Every page must be responsive.

Do not simply shrink desktop layouts.

Recompose layouts intelligently.

==================================================
26. ACCESSIBILITY

Implement:

Semantic HTML

Keyboard navigation

Visible focus states

Accessible labels

Good contrast

ARIA labels where appropriate

Keyboard-accessible dialogs

Do not rely only on color for priority

==================================================
27. FRONTEND ARCHITECTURE

Use a clean architecture:

src/
├── components/
│ ├── ui/
│ ├── layout/
│ ├── obligations/
│ ├── future-fund/
│ ├── shield/
│ └── dashboard/
│
├── pages/
│ ├── Overview
│ ├── Obligations
│ ├── ObligationDetail
│ ├── FutureFund
│ ├── Shield
│ ├── Activity
│ ├── Insights
│ └── Settings
│
├── services/
│ └── api.ts
│
├── data/
│ └── mockData.ts
│
├── types/
│ └── obligation.ts
│
├── hooks/
│
└── lib/

Create reusable components rather than duplicating UI code.

==================================================
28. NAVIGATION

All navigation must work.

Sidebar:

Overview
Obligations
Future Fund
Shield
Insights
Activity

Bottom:

Settings
Help

Clicking an obligation should open its detail page.

Back navigation should work.

Mobile navigation should work.

==================================================
29. FUNCTIONAL MOCK INTERACTIONS

The frontend must be functional with mock data.

Implement:

Search

Filtering

Sorting

Navigation

Mark complete

Reminder interaction

Future Fund creation

Shield activation

Shield closing

Notifications

Toast messages

Modal/drawer interactions

Do not create fake backend calls.

Use local mock state.

==================================================
30. DESIGN QUALITY CONTROL

Before considering each page complete, check:

Does this look like a real SaaS product?

Does it look human-designed?

Is the hierarchy obvious?

Is the UI calm?

Are there unnecessary cards?

Are there unnecessary gradients?

Are there unnecessary icons?

Does every section have a purpose?

Is the primary action obvious?

Can the user understand the page within a few seconds?

Does the page work on mobile?

Are loading states handled?

Are empty states handled?

Are errors handled?

Are components reusable?

Can the frontend connect to FastAPI later without major refactoring?

==================================================
31. ANTI-AI-GENERATED VISUAL RULE

This is extremely important.

Do not generate the common visual style associated with AI-generated websites.

Specifically avoid:

Generic purple/blue gradient hero sections

Excessive glassmorphism

Floating gradient blobs

Giant centered headings

Excessive pill buttons

Random illustrations

AI sparkle decorations

Too many cards

Too many statistics

Excessive rounded corners

Excessive shadows

Overuse of teal

Overuse of icons

Instead:

Use strong typography.

Use whitespace.

Use subtle borders.

Use restrained color.

Use meaningful alignment.

Use realistic content.

Use consistent spacing.

Use calm interaction design.

The final UI should look like a product that could actually be launched commercially.

==================================================
32. DATA CONSISTENCY

Use one source of truth for mock data.

For example:

If Car Insurance Renewal is marked completed:

Dashboard must update.

Obligations list must update.

Detail page must update.

Activity must show completion.

Shield must close if active.

Future Fund must update appropriately.

Do not maintain separate duplicated states.

==================================================
33. IMPLEMENTATION ORDER

Build in this exact order.

STEP 1:

Create the global design system.

STEP 2:

Create application shell and navigation.

STEP 3:

Build Overview/Dashboard.

STEP 4:

Build Obligations page.

STEP 5:

Build Obligation Detail page.

STEP 6:

Build Future Fund.

STEP 7:

Build Shield.

STEP 8:

Build Activity.

STEP 9:

Build Insights.

STEP 10:

Build Settings.

STEP 11:

Add notification center.

STEP 12:

Add loading, empty and error states.

STEP 13:

Add responsive layouts.

STEP 14:

Add micro-interactions.

STEP 15:

Perform final visual consistency review.

Do not sacrifice visual quality for speed.

==================================================
34. BACKEND INTEGRATION READINESS

The backend will be implemented separately using FastAPI.

The frontend should eventually consume APIs such as:

GET /api/dashboard

GET /api/obligations

GET /api/obligations/{id}

POST /api/obligations

PUT /api/obligations/{id}

POST /api/obligations/{id}/complete

POST /api/obligations/{id}/remind

POST /api/process-message

GET /api/future-funds

POST /api/future-funds

GET /api/shields

POST /api/shields

POST /api/shields/{id}/activate

POST /api/shields/{id}/close

GET /api/activity

Do not implement these backend endpoints now.

Only ensure the frontend architecture is ready to consume them later.

==================================================
35. PRODUCT SCOPE

DO NOT create:

Real banking

Real payments

Real SIP

Real investments

Real insurance

Payment gateway

WhatsApp

Mobile app

Complex family management

Advanced analytics

Real financial transactions

Future Fund and Shield remain prototype simulations.

==================================================
36. FINAL ACCEPTANCE CRITERIA

The frontend is complete only when:

All pages exist.

Navigation works.

Mock data is realistic.

Search works.

Filtering works.

Sorting works.

Obligation detail works.

Mark complete works.

Reminder interaction works.

Future Fund interaction works.

Shield interaction works.

Notifications work.

Loading states exist.

Empty states exist.

Error states exist.

Responsive layouts work.

Accessibility basics are implemented.

Components are reusable.

Mock data has a single source of truth.

API service abstraction exists.

No backend or external integrations are implemented.

The visual system is consistent across all pages.

The application does not look like a generic AI-generated dashboard.

The final UI feels like a polished commercial SaaS product.

==================================================
37. FINAL INSTRUCTION

Build the complete Obliqo frontend now.

Prioritize:

Product clarity

Professional visual design

Consistency

Usability

Realistic interactions

Responsive behavior

Accessibility

Backend integration readiness

Do not add features outside the specification.

Do not implement backend functionality.

Do not implement external integrations.

Do not sacrifice quality for quantity.

The final result should feel like a real premium product called Obliqo, not an AI-generated prototype.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/323e9945-1493-4044-a0dc-a591a1cb5868).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
