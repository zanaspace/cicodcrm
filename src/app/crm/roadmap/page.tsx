"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarRange, CheckCircle2, Clock, ShieldAlert, Layers, Users, CreditCard,
  Target, MessageSquare, Settings, Database, ArrowRight, Filter, Search,
  ChevronDown, ChevronRight, ExternalLink, Sparkles, AlertTriangle, FileText,
  BarChart3, CheckSquare, Square, Download, Share2, HelpCircle, Copy, Check,
  BookOpen, Code2, ShieldCheck, UserCheck, PanelLeft, PanelLeftClose, PanelLeftOpen,
  FlaskConical
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { PRDViewer } from "./components/PRDViewer";
import { TestCasesViewer } from "./components/TestCasesViewer";
import { SPRINT_TEST_CASES, TestCaseItem } from "./data/testCasesData";

// --- Types ---
export type TaskItem = {
  id: string;
  title: string;
  desc: string;
  discipline: "frontend" | "backend" | "design" | "qa";
  estimate: "S" | "M" | "L" | "XL";
  completed?: boolean;
  deliverableId?: string;
};

export type UserStory = {
  id: string; // e.g. "US-0.1"
  title: string;
  asA: string;
  iWant: string;
  soThat: string;
  acceptanceCriteria: string[];
};

export type DeliverableItem = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  story: UserStory;
  tasks: TaskItem[];
};

export type PRDSection = {
  version: string;
  status: string;
  targetTimeline: string;
  stakeholders: string[];
  docFileName: string;
  problemStatement: string[];
  personas: { role: string; desc: string }[];
  functionalEpics: {
    epicTitle: string;
    description: string;
    requirements: string[];
  }[];
  techArchitecture: string[];
  nfrs: string[];
  dodList: string[];
};

export type Phase = {
  id: string;
  sprintNum: number;
  title: string;
  subtitle: string;
  badge: string;
  duration: string;
  status: "Completed" | "In Progress" | "Planned";
  goal: string;
  businessValue: string;
  leadIcon: React.ElementType;
  deliverables: DeliverableItem[];
  tasks: TaskItem[];
  apiContracts: {
    endpoint: string;
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    desc: string;
  }[];
  dod: string[];
  risks: string[];
  prd: PRDSection;
};

// --- Phases Master Data ---
const PHASES: Phase[] = [
  {
    id: "sprint-0",
    sprintNum: 0,
    title: "Design System & Core UI Atoms",
    subtitle: "Establish design tokens, typography, and reusable component harness",
    badge: "Foundation",
    duration: "Week 1",
    status: "Completed",
    goal: "Translate cicod_premium_styleguide.html into scalable tokens and shared React components so zero subsequent screens build ad-hoc tables, buttons, or dialogs.",
    businessValue: "Eliminates ~2,500 lines of duplicate code and guarantees 100% visual consistency across all 25+ CRM screens.",
    leadIcon: Layers,
    deliverables: [
    {
        "id": "s0-d1",
        "title": "Tokens & Theme System",
        "description": "Paper & Navy CSS variables, Sora + Inter typography, dark mode synchronization.",
        "tags": [
            "CSS Tokens",
            "Dark Mode",
            "Typography"
        ],
        "story": {
            "id": "US-0.1",
            "title": "Centralized Design Tokens & Theme Engine",
            "asA": "Frontend Engineer / UI Architect",
            "iWant": "a centralized design token dictionary with CSS variables and automated dark mode sync",
            "soThat": "every CRM component adheres strictly to the design system with zero hardcoded ad-hoc styles",
            "acceptanceCriteria": [
                "Theme variables switch cleanly between light and dark mode without contrast failure.",
                "Typography rules apply Sora for headings, Inter for body copy, and JetBrains Mono for code.",
                "Tokens are mapped directly to Tailwind utilities and CSS variables."
            ]
        },
        "tasks": [
            {
                "id": "s0-1",
                "title": "Map styleguide CSS variables to Tailwind & globals.css",
                "desc": "Ensure --primary, --secondary, --card, --border, --muted are consistent across light/dark.",
                "discipline": "design",
                "estimate": "S",
                "completed": true
            },
            {
                "id": "s0-2",
                "title": "Build accessible StatusBadge & HealthBadge components",
                "desc": "Standardize soft badge pills for Draft, Live, Overdue, Healthy, Suspended.",
                "discipline": "frontend",
                "estimate": "S",
                "completed": true
            },
            {
                "id": "s0-6",
                "title": "Theme synchronization hook with system preference & storage",
                "desc": "Implement persistent theme subscriber with zero flash of unstyled content.",
                "discipline": "frontend",
                "estimate": "S",
                "completed": true
            }
        ]
    },
    {
        "id": "s0-d2",
        "title": "Universal DataTable & FilterBar",
        "description": "Virtualized table harness with windowed pagination (1 2 3 … 10), column chooser, and sticky actions.",
        "tags": [
            "DataTable",
            "FilterBar",
            "Pagination"
        ],
        "story": {
            "id": "US-0.2",
            "title": "Virtualized DataTable & Multi-Predicate FilterBar",
            "asA": "Product Operations Specialist",
            "iWant": "a virtualized DataTable component with windowed pagination and responsive column chooser",
            "soThat": "I can browse dense datasets of 13,000+ records with fast responsiveness and sticky action access",
            "acceptanceCriteria": [
                "Table renders 100+ rows smoothly with windowed pagination (1 2 3 … 10).",
                "Column chooser allows toggling secondary column visibility on dense screens.",
                "Sticky action column remains pinned on horizontal scroll with accessible dropdowns."
            ]
        },
        "tasks": [
            {
                "id": "s0-3",
                "title": "Implement virtualized DataTable with windowed pagination",
                "desc": "Build table shell with responsive horizontal overflow and sticky action columns.",
                "discipline": "frontend",
                "estimate": "M",
                "completed": true
            },
            {
                "id": "s0-7",
                "title": "Build multi-predicate FilterBar with debounced search",
                "desc": "Support text search, segment pills, and multi-select filter dropdowns.",
                "discipline": "frontend",
                "estimate": "M",
                "completed": true
            },
            {
                "id": "s0-5",
                "title": "Automated component visual regression check",
                "desc": "Verify token rendering across desktop (1440px) and tablet resolutions.",
                "discipline": "qa",
                "estimate": "S",
                "completed": true
            }
        ]
    },
    {
        "id": "s0-d3",
        "title": "Safe Action Modals & Dialogs",
        "description": "ConfirmDialog requiring typed feedback or reason selection for dangerous actions.",
        "tags": [
            "Modals",
            "A11y",
            "Safety"
        ],
        "story": {
            "id": "US-0.3",
            "title": "Safe Action Confirmation Modals & Accessible Primitives",
            "asA": "Customer Operations Specialist",
            "iWant": "standardized dialog and modal primitives with typed confirmation gates for dangerous actions",
            "soThat": "high-risk actions like tenant suspensions or archiving cannot occur through accidental single-clicks",
            "acceptanceCriteria": [
                "Destructive actions require typing a confirmation phrase or selecting a mandatory reason.",
                "Modals enforce keyboard focus trapping and dismiss on Escape with proper ARIA attributes.",
                "Animated entrance and exit transitions match design system tokens."
            ]
        },
        "tasks": [
            {
                "id": "s0-4",
                "title": "Standardize Button and Modal primitives",
                "desc": "Ensure role='dialog', focus traps, Esc key handling, and aria attributes.",
                "discipline": "frontend",
                "estimate": "M",
                "completed": true
            },
            {
                "id": "s0-8",
                "title": "Implement SwitchRow with left-0 knob alignment",
                "desc": "Interactive toggle with full-card clickability and accessible keyboard focus.",
                "discipline": "frontend",
                "estimate": "S",
                "completed": true
            },
            {
                "id": "s0-9",
                "title": "Accessibility audit for modal focus traps & screen readers",
                "desc": "Verify WCAG 2.1 AA keyboard navigation across all dialog interactions.",
                "discipline": "qa",
                "estimate": "S",
                "completed": true
            }
        ]
    }
],
    tasks: [
    {
        "id": "s0-1",
        "title": "Map styleguide CSS variables to Tailwind & globals.css",
        "desc": "Ensure --primary, --secondary, --card, --border, --muted are consistent across light/dark.",
        "discipline": "design",
        "estimate": "S",
        "completed": true
    },
    {
        "id": "s0-2",
        "title": "Build accessible StatusBadge & HealthBadge components",
        "desc": "Standardize soft badge pills for Draft, Live, Overdue, Healthy, Suspended.",
        "discipline": "frontend",
        "estimate": "S",
        "completed": true
    },
    {
        "id": "s0-6",
        "title": "Theme synchronization hook with system preference & storage",
        "desc": "Implement persistent theme subscriber with zero flash of unstyled content.",
        "discipline": "frontend",
        "estimate": "S",
        "completed": true
    },
    {
        "id": "s0-3",
        "title": "Implement virtualized DataTable with windowed pagination",
        "desc": "Build table shell with responsive horizontal overflow and sticky action columns.",
        "discipline": "frontend",
        "estimate": "M",
        "completed": true
    },
    {
        "id": "s0-7",
        "title": "Build multi-predicate FilterBar with debounced search",
        "desc": "Support text search, segment pills, and multi-select filter dropdowns.",
        "discipline": "frontend",
        "estimate": "M",
        "completed": true
    },
    {
        "id": "s0-5",
        "title": "Automated component visual regression check",
        "desc": "Verify token rendering across desktop (1440px) and tablet resolutions.",
        "discipline": "qa",
        "estimate": "S",
        "completed": true
    },
    {
        "id": "s0-4",
        "title": "Standardize Button and Modal primitives",
        "desc": "Ensure role='dialog', focus traps, Esc key handling, and aria attributes.",
        "discipline": "frontend",
        "estimate": "M",
        "completed": true
    },
    {
        "id": "s0-8",
        "title": "Implement SwitchRow with left-0 knob alignment",
        "desc": "Interactive toggle with full-card clickability and accessible keyboard focus.",
        "discipline": "frontend",
        "estimate": "S",
        "completed": true
    },
    {
        "id": "s0-9",
        "title": "Accessibility audit for modal focus traps & screen readers",
        "desc": "Verify WCAG 2.1 AA keyboard navigation across all dialog interactions.",
        "discipline": "qa",
        "estimate": "S",
        "completed": true
    }
],
    apiContracts: [
      { endpoint: "N/A - Client-side UI Harness", method: "GET", desc: "Sprint 0 focuses on UI atoms and shared presentation architecture." }
    ],
    dod: [
      "All tokens rendered in light and dark mode without color leaks.",
      "DataTable supports sticky actions, sorting, and responsive truncation.",
      "Zero TypeScript errors with strict typing enabled."
    ],
    risks: [
      "Ad-hoc styles creeping in if developers bypass design tokens.",
      "Inconsistent button sizing if variants are not enforced."
    ],
    prd: {
      version: "1.0.0",
      status: "Approved / Completed",
      targetTimeline: "Sprint 0 (Week 1)",
      docFileName: "Sprint_0_Design_System_Core_UI_Atoms.md",
      stakeholders: ["Frontend Engineers", "UI/UX Designers", "Product Managers", "QA Engineers"],
      problemStatement: [
        "Ad-hoc styling: Every page reinvents buttons, tables, badges, and modals.",
        "Fragile tables: Over 13 unformatted columns spilling off 1440px displays with clipped actions.",
        "Unsafe UX: Destructive actions (Suspend tenant, Delete) used generic green success styles or lacked confirmation modals.",
        "Redundant code: Approximately 450 lines of boilerplate per list page (~2,500 lines across 7 list views)."
      ],
      personas: [
        { role: "CRM Operations Specialist", desc: "Needs high-contrast, easily scan-able tables that don't overflow or jitter during live customer lookups." },
        { role: "Frontend Engineer", desc: "Needs clean, strictly typed, reusable React 19 primitives with zero styling leaks." },
        { role: "Accessibility Auditor", desc: "Requires WCAG 2.1 AA contrast, keyboard accessibility (Esc, Tab, Enter), and screen-reader compliant ARIA landmarks." }
      ],
      functionalEpics: [
        {
          epicTitle: "Design Tokens & Typography Engine",
          description: "Port CSS variables from cicod_premium_styleguide.html into src/app/globals.css.",
          requirements: [
            "Signal Primary: --primary: #F2A93B, --primary-foreground: #0C1A2E.",
            "Ink Secondary: --secondary: #12253F, --secondary-foreground: #FFFFFF.",
            "Paper Backgrounds: --background: #F4F5F7, --card: #FFFFFF, --border: #E1E5EB.",
            "Load Google Fonts Sora (headings: 600, 700, 800) and Inter (body: 400, 500, 600)."
          ]
        },
        {
          epicTitle: "Universal Presentation Atoms",
          description: "Standardize Button variants, StatusBadges, and accessible SwitchRow controls.",
          requirements: [
            "Button variants: default (amber), secondary (navy), outline, destructive, ghost.",
            "StatusBadge & HealthBadge: Soft pill badges with semantic dot indicator and subtle background tint.",
            "SwitchRow: Full-card clickable on/off toggle with knob strictly anchored to left-0 (translate-x-1 when off, translate-x-6 when on)."
          ]
        },
        {
          epicTitle: "Universal Data Display Harness",
          description: "Generic DataTable<T>, FilterBar, and windowed Pagination components.",
          requirements: [
            "Generic TypeScript table with sticky Actions column (⋯) pinned to the right edge (48px).",
            "Column Chooser ('Customize View') with persistent visibility toggles.",
            "Windowed numeric pagination (1 2 3 … 10) replacing broken legacy 134-button pager.",
            "Omni-search text input with instant clear and 250ms debounce."
          ]
        }
      ],
      techArchitecture: [
        "src/app/globals.css: Master CSS variables (Paper & Ink palette)",
        "src/components/ui/Button.tsx: Shared button primitive with variants",
        "src/components/ui/StatusBadge.tsx: Semantic pill status and health badges",
        "src/components/ui/ConfirmDialog.tsx: Safe destructive modal with reason validation",
        "src/components/layout/DataTable.tsx: Universal table with sticky actions",
        "src/components/layout/Pagination.tsx: Windowed pager (1 2 3 ... 10)"
      ],
      nfrs: [
        "Table renders up to 100 rows with < 16ms frame budget (zero scrolling lag).",
        "WCAG 2.1 AA compliant color contrast (4.5:1 minimum on text). Keyboard accessible controls.",
        "100% TypeScript type safety without any casts. ESLint passing with zero warnings."
      ],
      dodList: [
        "Given a switch in SwitchRow, when toggled ON or OFF, the white knob remains strictly within the 44px pill track without overflowing.",
        "Given any table built on DataTable, the Actions column remains pinned to the right edge with consistent width across all viewports.",
        "Given a destructive action triggered via ConfirmDialog, the confirm button remains disabled until a reason is provided.",
        "All tokens adapt correctly between light and dark themes without unstyled flashes."
      ]
    }
  },
  {
    id: "sprint-1",
    sprintNum: 1,
    title: "App Shell, Navigation & Reference Data",
    subtitle: "Consolidated reference data, dynamic breadcrumbs, and 2-level IA",
    badge: "Architecture",
    duration: "Week 2",
    status: "In Progress",
    goal: "Replace the bloated 8-tier legacy menu with a clean 2-level sidebar, dynamic breadcrumbs, user favorites, and a unified Reference Data hub.",
    businessValue: "Gives back horizontal workspace on tables and allows operational teams to curate currencies, locations, and sectors in one place.",
    leadIcon: Settings,
    deliverables: [
    {
        "id": "s1-d1",
        "title": "Dual/Collapsible App Sidebar",
        "description": "Grouped by job: Daily Operations, Growth, Administration. Collapses from 260px to 72px.",
        "tags": [
            "Sidebar",
            "IA",
            "Navigation"
        ],
        "story": {
            "id": "US-1.1",
            "title": "Collapsible App Sidebar Navigation",
            "asA": "CRM Daily User",
            "iWant": "a clean 2-level collapsible sidebar navigation grouped by Daily Operations, Growth, and Administration",
            "soThat": "I can switch modules quickly without getting lost in legacy 8-tier nested submenus",
            "acceptanceCriteria": [
                "Sidebar collapses from 260px expanded to 72px icon rail with active badge tooltips.",
                "Active group and leaf routes automatically highlight based on URL pathname.",
                "Favorites section pins frequently accessed pages for 1-click access."
            ]
        },
        "tasks": [
            {
                "id": "s1-2",
                "title": "Build Favorites manager with localStorage persistence",
                "desc": "Allow starring any filtered list view or quick action into the sidebar.",
                "discipline": "frontend",
                "estimate": "M",
                "completed": true
            },
            {
                "id": "s1-6",
                "title": "Implement collapsible sidebar rail with smooth width transition",
                "desc": "Animated collapse/expand with responsive 72px/260px margins.",
                "discipline": "frontend",
                "estimate": "M",
                "completed": true
            },
            {
                "id": "s1-7",
                "title": "Audit mobile drawer behavior and viewport responsiveness",
                "desc": "Verify mobile sidebar drawer overlay, focus traps, and touch targets.",
                "discipline": "qa",
                "estimate": "S",
                "completed": true
            }
        ]
    },
    {
        "id": "s1-d2",
        "title": "Dynamic Breadcrumbs & Header",
        "description": "Path-computed navigation with active entity titles and Quick Search.",
        "tags": [
            "Header",
            "Breadcrumbs",
            "Favorites"
        ],
        "story": {
            "id": "US-1.2",
            "title": "Dynamic Breadcrumbs & Contextual Header",
            "asA": "Account Support Agent",
            "iWant": "a path-computed dynamic breadcrumb bar displaying actual customer or plan names instead of static labels",
            "soThat": "I always know my exact location within deeply nested customer and catalogue hierarchies",
            "acceptanceCriteria": [
                "Breadcrumb dynamically resolves entity names from active route params.",
                "Clicking any parent crumb navigates back with preserved filter state.",
                "Header includes quick theme switcher, favorites star, and Roadmap link."
            ]
        },
        "tasks": [
            {
                "id": "s1-1",
                "title": "Implement dynamic breadcrumbs in Header.tsx",
                "desc": "Build breadcrumb hierarchy from route matchers instead of hard-coded strings.",
                "discipline": "frontend",
                "estimate": "M",
                "completed": true
            },
            {
                "id": "s1-8",
                "title": "Add entity name resolver for customer, plan, and lead IDs",
                "desc": "Resolve actual company and plan names in breadcrumb trail dynamically.",
                "discipline": "frontend",
                "estimate": "S",
                "completed": true
            },
            {
                "id": "s1-9",
                "title": "Automated navigation path test suite covering all 25 routes",
                "desc": "Test active leaf matching and breadcrumb hierarchy across deep paths.",
                "discipline": "qa",
                "estimate": "S",
                "completed": true
            }
        ]
    },
    {
        "id": "s1-d3",
        "title": "Unified Reference Data Module",
        "description": "Single screen for Currencies (NGN, USD, GBP), Operating Locations (Country/State/LGA), and Sectors.",
        "tags": [
            "Reference Data",
            "Currencies",
            "Locations"
        ],
        "story": {
            "id": "US-1.3",
            "title": "Consolidated Reference Data Workspace",
            "asA": "System Administrator",
            "iWant": "a consolidated Reference Data workspace to configure active currencies, operating locations, and business sectors",
            "soThat": "I can curate core platform reference entities in one central hub instead of 8 fragmented legacy pages",
            "acceptanceCriteria": [
                "Currencies view allows toggling active trading currencies (NGN, USD, GBP, KES, GHS).",
                "Operating locations tree supports Country → State → LGA drilldown.",
                "Reference data changes propagate immediately to plan editors and merchant forms."
            ]
        },
        "tasks": [
            {
                "id": "s1-3",
                "title": "Consolidate 8 Business Setup pages into ReferenceView",
                "desc": "Tabbed interface for Currencies, Locations, Business Types, and Payment Channels.",
                "discipline": "frontend",
                "estimate": "L",
                "completed": true
            },
            {
                "id": "s1-4",
                "title": "Move Service Types & Product Types under Settings",
                "desc": "Relocate low-volume catalogue reference data out of primary navigation.",
                "discipline": "frontend",
                "estimate": "S",
                "completed": true
            },
            {
                "id": "s1-5",
                "title": "Define Reference Data API Contract",
                "desc": "Implement endpoints for full list retrieval without legacy 100-record truncation.",
                "discipline": "backend",
                "estimate": "M",
                "completed": false
            }
        ]
    }
],
    tasks: [
    {
        "id": "s1-2",
        "title": "Build Favorites manager with localStorage persistence",
        "desc": "Allow starring any filtered list view or quick action into the sidebar.",
        "discipline": "frontend",
        "estimate": "M",
        "completed": true
    },
    {
        "id": "s1-6",
        "title": "Implement collapsible sidebar rail with smooth width transition",
        "desc": "Animated collapse/expand with responsive 72px/260px margins.",
        "discipline": "frontend",
        "estimate": "M",
        "completed": true
    },
    {
        "id": "s1-7",
        "title": "Audit mobile drawer behavior and viewport responsiveness",
        "desc": "Verify mobile sidebar drawer overlay, focus traps, and touch targets.",
        "discipline": "qa",
        "estimate": "S",
        "completed": true
    },
    {
        "id": "s1-1",
        "title": "Implement dynamic breadcrumbs in Header.tsx",
        "desc": "Build breadcrumb hierarchy from route matchers instead of hard-coded strings.",
        "discipline": "frontend",
        "estimate": "M",
        "completed": true
    },
    {
        "id": "s1-8",
        "title": "Add entity name resolver for customer, plan, and lead IDs",
        "desc": "Resolve actual company and plan names in breadcrumb trail dynamically.",
        "discipline": "frontend",
        "estimate": "S",
        "completed": true
    },
    {
        "id": "s1-9",
        "title": "Automated navigation path test suite covering all 25 routes",
        "desc": "Test active leaf matching and breadcrumb hierarchy across deep paths.",
        "discipline": "qa",
        "estimate": "S",
        "completed": true
    },
    {
        "id": "s1-3",
        "title": "Consolidate 8 Business Setup pages into ReferenceView",
        "desc": "Tabbed interface for Currencies, Locations, Business Types, and Payment Channels.",
        "discipline": "frontend",
        "estimate": "L",
        "completed": true
    },
    {
        "id": "s1-4",
        "title": "Move Service Types & Product Types under Settings",
        "desc": "Relocate low-volume catalogue reference data out of primary navigation.",
        "discipline": "frontend",
        "estimate": "S",
        "completed": true
    },
    {
        "id": "s1-5",
        "title": "Define Reference Data API Contract",
        "desc": "Implement endpoints for full list retrieval without legacy 100-record truncation.",
        "discipline": "backend",
        "estimate": "M",
        "completed": false
    }
],
    apiContracts: [
      { endpoint: "/api/v2/reference/currencies", method: "GET", desc: "Returns active trading currencies with usage flags." },
      { endpoint: "/api/v2/reference/locations", method: "GET", desc: "Hierarchical Country → State → LGA operational tree." },
      { endpoint: "/api/v2/reference/sectors", method: "GET", desc: "Business sectors with child business types." },
      { endpoint: "/api/v2/reference/payment-methods", method: "PATCH", desc: "Toggles offline method availability and reference requirements." }
    ],
    dod: [
      "Breadcrumb reflects exact path hierarchy on all nested views.",
      "Deactivating a currency in Reference Data immediately removes it from plan editors.",
      "Reference lists load complete records without legacy 100-item cutoff."
    ],
    risks: [
      "Deleting or switching off a sector that is actively used by existing merchants.",
      "Slow location hierarchy queries if regions are deeply nested."
    ],
    prd: {
      version: "1.0.0",
      status: "In Progress",
      targetTimeline: "Sprint 1 (Week 2)",
      docFileName: "Sprint_1_App_Shell_Navigation_Reference_Data.md",
      stakeholders: ["Frontend Engineers", "Backend Architects", "Product Ops", "Sales & Billing Leads"],
      problemStatement: [
        "Deep Navigation Nesting: The legacy sidebar contained 8 arbitrary top-level sections, including standalone pages for 1-row reference data.",
        "Hard-coded Breadcrumbs: The navigation breadcrumb displayed 'Home › Customer Mgt › Customers' on every screen, including Offers and Settings.",
        "Fragmented Business Setup: 8 separate pages held 119 active currencies (including retired ISO codes like ZMK, VEF), 251 uncurated countries, and truncated business type lists (100 items returned when 159 existed).",
        "Wasted Screen Width: Fixed-width sidebar left insufficient room for 13 data columns."
      ],
      personas: [
        { role: "System Administrator", desc: "Curates available currencies, countries, sectors, and offline payment channels." },
        { role: "Customer Support Rep", desc: "Navigates quickly between active merchant accounts, frequently used reports, and dunning queues." },
        { role: "Product Manager", desc: "Needs confidence that reference changes (e.g. disabling a currency) immediately protect commercial plans." }
      ],
      functionalEpics: [
        {
          epicTitle: "Collapsible App Shell & Sidebar",
          description: "Max 2 levels under Daily Operations, Growth, Administration. Collapses from 260px to 72px.",
          requirements: [
            "Expanded width 260px; collapsed width 72px (icon-only mode with floating tooltips).",
            "Grouped strictly by job functions: Daily Operations, Growth, Campaign Studio, Administration.",
            "Maximum depth 2 levels. No 3rd level sub-menus."
          ]
        },
        {
          epicTitle: "Dynamic Header, Breadcrumbs & Favorites",
          description: "Route-computed navigation breadcrumb hierarchy and customizable user favorites.",
          requirements: [
            "Computed from active Next.js pathname matching against lib/nav.ts.",
            "Detail routes dynamically display entity names (e.g. Home > Customer Management > Customers > crmdemo (#23488)).",
            "Favorites section in sidebar stores starred filtered views in localStorage.",
            "Quick Search trigger (Ctrl+K / Cmd+K) and direct links to Sprint Roadmap and Module Map."
          ]
        },
        {
          epicTitle: "Unified Reference Data Hub (/crm/settings/reference)",
          description: "Single screen for Currencies, Locations, Sectors, and Payment Channels.",
          requirements: [
            "Currencies: Guard rail prevents toggling off currencies in active commercial use.",
            "Locations: Hierarchical Country → State → LGA management with completeness badges.",
            "Sectors & Types: Cascading parent-child selectors with inline type additions.",
            "Payment Channels: Online vs. offline method toggles with mandatory reference flags."
          ]
        }
      ],
      techArchitecture: [
        "src/lib/nav.ts: Single source of truth for sidebar, routes, and breadcrumbs",
        "src/components/layout/Sidebar.tsx: Collapsible two-level navigation rail",
        "src/components/layout/Header.tsx: Dynamic breadcrumbs, favorites trigger, and roadmap CTA",
        "src/app/crm/settings/components/ReferenceView.tsx: Consolidated reference data hub"
      ],
      nfrs: [
        "Navigation Latency: Zero-delay client routing (< 50ms) using Next.js Link prefetching.",
        "State Resilience: Active sidebar scroll position and collapsed state persist across page reloads.",
        "Reference Data Pagination: Must support all=true queries to prevent legacy 100-record truncation on Business Types (159 total)."
      ],
      dodList: [
        "Given any nested page, the breadcrumb accurately displays the hierarchy and entity title.",
        "Given an active currency used in a live pricing plan, attempting to toggle it off displays an error toast and blocks the mutation.",
        "Starred favorites appear immediately in the sidebar and persist across browser sessions.",
        "Service Types, Product Types, and Bundle Groups are accessible under Settings › Catalogue Setup, not in the primary sidebar root."
      ]
    }
  },
  {
    id: "sprint-2",
    sprintNum: 2,
    title: "Commercial Catalogue & Pricing Matrix",
    subtitle: "Hierarchical Products & Plans, Bundles, and multi-currency pricing",
    badge: "Commercial",
    duration: "Week 3",
    status: "Planned",
    goal: "Replace 7 disjointed catalogue screens with a unified Products & Plans workspace, 5-step plan editor, and multi-currency pricing matrix.",
    businessValue: "Allows product managers to configure, price, and publish plans in minutes instead of managing loose, duplicated offer records.",
    leadIcon: Layers,
    deliverables: [
    {
        "id": "s2-d1",
        "title": "Products & Plans Tree Workspace",
        "description": "Product sidebar on left; comparative plan cards and feature checklist on right.",
        "tags": [
            "Catalogue",
            "Plans",
            "Features"
        ],
        "story": {
            "id": "US-2.1",
            "title": "Products & Plans Two-Pane Explorer",
            "asA": "Commercial Product Manager",
            "iWant": "a split-pane Products & Plans workspace with product tree on left and comparative plan cards on right",
            "soThat": "I can visually evaluate plan feature differences and pricing tiers without toggling screens",
            "acceptanceCriteria": [
                "Sidebar displays all active software products with live plan counters.",
                "Comparative cards show monthly/annual prices, features checklist, and status badges.",
                "Search and filter isolates plans by status (Draft, Live, Archived)."
            ]
        },
        "tasks": [
            {
                "id": "s2-1",
                "title": "Build Products & Plans explorer view",
                "desc": "Display active plans side-by-side with feature comparison matrix.",
                "discipline": "frontend",
                "estimate": "L"
            },
            {
                "id": "s2-6",
                "title": "Implement product tree filter sidebar with category badges",
                "desc": "Sidebar displaying live product categories, tier counts, and status filters.",
                "discipline": "frontend",
                "estimate": "M"
            },
            {
                "id": "s2-7",
                "title": "Comparative plan feature diff visualizer",
                "desc": "Highlight included and excluded features across Starter, Standard, and Enterprise tiers.",
                "discipline": "frontend",
                "estimate": "M"
            }
        ]
    },
    {
        "id": "s2-d2",
        "title": "5-Step Plan Editor Stepper",
        "description": "Basics → Features checklist → Multi-currency Pricing matrix → Trial & Extras → Review & Publish.",
        "tags": [
            "Plan Editor",
            "Pricing Matrix",
            "Stepper"
        ],
        "story": {
            "id": "US-2.2",
            "title": "Multi-Currency Plan Creation Wizard",
            "asA": "Pricing Specialist",
            "iWant": "a structured 5-step wizard to configure plan basics, features, multi-currency matrix, trials, and publishing",
            "soThat": "I never publish incomplete plans with missing currency equivalents or unverified terms",
            "acceptanceCriteria": [
                "5-step wizard enforces: Basics → Features → Pricing Matrix → Trial/Extras → Review.",
                "Pricing matrix supports NGN, USD, GBP, EUR with annual 10x multiplier shortcut.",
                "Live preview card updates dynamically as pricing and features are edited."
            ]
        },
        "tasks": [
            {
                "id": "s2-2",
                "title": "Implement Pricing Matrix table with NGN/USD/GBP",
                "desc": "Include annual pricing autofill helper (10x monthly = 2 months free).",
                "discipline": "frontend",
                "estimate": "M"
            },
            {
                "id": "s2-3",
                "title": "Build Plan Editor 5-step stepper with live preview card",
                "desc": "Interactive wizard with real-time public pricing card visualization.",
                "discipline": "frontend",
                "estimate": "XL"
            },
            {
                "id": "s2-5",
                "title": "Enforce Lifecycle: Draft → Live → Archived",
                "desc": "Block archiving if active customers or bundles reference the plan.",
                "discipline": "backend",
                "estimate": "M"
            }
        ]
    },
    {
        "id": "s2-d3",
        "title": "Bundle Editor & Savings Engine",
        "description": "Compose multi-product bundles, set seat limits, and calculate customer savings.",
        "tags": [
            "Bundles",
            "Discounts",
            "Licensing"
        ],
        "story": {
            "id": "US-2.3",
            "title": "Multi-Product Bundle Composer & Savings Engine",
            "asA": "Sales Operations Director",
            "iWant": "a Bundle Editor to compose multi-product software packages with custom seat licensing and savings calculations",
            "soThat": "we can sell bundled solution packages that clearly show merchant percentage discounts",
            "acceptanceCriteria": [
                "Allows selecting 1 active plan per included product with seat minimums/maximums.",
                "Automatically calculates aggregate individual price vs bundle discounted price.",
                "Publishing checks that all component plans are in Live status."
            ]
        },
        "tasks": [
            {
                "id": "s2-4",
                "title": "Implement Bundle Editor with product chips",
                "desc": "Select 1 live plan per product and define minimum/maximum user licenses.",
                "discipline": "frontend",
                "estimate": "L"
            },
            {
                "id": "s2-8",
                "title": "Build bundle customer savings computation engine",
                "desc": "Compute bundle discount percentages and display comparative customer ROI badge.",
                "discipline": "frontend",
                "estimate": "S"
            },
            {
                "id": "s2-9",
                "title": "Bundle component dependency validator in backend",
                "desc": "Prevent deletion or unpublishing of plans active inside public bundles.",
                "discipline": "backend",
                "estimate": "M"
            }
        ]
    }
],
    tasks: [
    {
        "id": "s2-1",
        "title": "Build Products & Plans explorer view",
        "desc": "Display active plans side-by-side with feature comparison matrix.",
        "discipline": "frontend",
        "estimate": "L"
    },
    {
        "id": "s2-6",
        "title": "Implement product tree filter sidebar with category badges",
        "desc": "Sidebar displaying live product categories, tier counts, and status filters.",
        "discipline": "frontend",
        "estimate": "M"
    },
    {
        "id": "s2-7",
        "title": "Comparative plan feature diff visualizer",
        "desc": "Highlight included and excluded features across Starter, Standard, and Enterprise tiers.",
        "discipline": "frontend",
        "estimate": "M"
    },
    {
        "id": "s2-2",
        "title": "Implement Pricing Matrix table with NGN/USD/GBP",
        "desc": "Include annual pricing autofill helper (10x monthly = 2 months free).",
        "discipline": "frontend",
        "estimate": "M"
    },
    {
        "id": "s2-3",
        "title": "Build Plan Editor 5-step stepper with live preview card",
        "desc": "Interactive wizard with real-time public pricing card visualization.",
        "discipline": "frontend",
        "estimate": "XL"
    },
    {
        "id": "s2-5",
        "title": "Enforce Lifecycle: Draft → Live → Archived",
        "desc": "Block archiving if active customers or bundles reference the plan.",
        "discipline": "backend",
        "estimate": "M"
    },
    {
        "id": "s2-4",
        "title": "Implement Bundle Editor with product chips",
        "desc": "Select 1 live plan per product and define minimum/maximum user licenses.",
        "discipline": "frontend",
        "estimate": "L"
    },
    {
        "id": "s2-8",
        "title": "Build bundle customer savings computation engine",
        "desc": "Compute bundle discount percentages and display comparative customer ROI badge.",
        "discipline": "frontend",
        "estimate": "S"
    },
    {
        "id": "s2-9",
        "title": "Bundle component dependency validator in backend",
        "desc": "Prevent deletion or unpublishing of plans active inside public bundles.",
        "discipline": "backend",
        "estimate": "M"
    }
],
    apiContracts: [
      { endpoint: "/api/v2/catalogue/products", method: "GET", desc: "List products with plan counts and linked features." },
      { endpoint: "/api/v2/catalogue/plans", method: "POST", desc: "Create or update plan draft with multi-currency pricing array." },
      { endpoint: "/api/v2/catalogue/plans/{code}/publish", method: "PATCH", desc: "Publish plan to public catalog after gap-check validation." },
      { endpoint: "/api/v2/catalogue/bundles", method: "POST", desc: "Create bundle combining selected product plan IDs." }
    ],
    dod: [
      "A plan cannot be published without at least one primary currency (NGN) price.",
      "Publishing or unpublishing confirms with full impact summary (affected bundles/users).",
      "Features (Product Captions) are managed directly inside the plan workflow."
    ],
    risks: [
      "Currency rate volatility if rates are hardcoded rather than configured.",
      "Unpublishing a live plan currently selected in an active marketing campaign."
    ],
    prd: {
      version: "1.0.0",
      status: "Planned",
      targetTimeline: "Sprint 2 (Week 3)",
      docFileName: "Sprint_2_Commercial_Catalogue_Pricing_Matrix.md",
      stakeholders: ["Product Managers", "Commercial Directors", "Billing Ops", "Frontend & Backend Engineers"],
      problemStatement: [
        "Dispersed Commercial Architecture: Catalogue spread across 7 disjointed tables.",
        "Lost Pricing in Redesign: Early prototype modals omitted multi-currency pricing, feature checklists, and trials.",
        "Duplicate Legacy Offers: About 25 of 35 single offers were duplicate or obsolete records ('Premium.', 'Premium 1').",
        "Invisible Pricing Gaps: No screen visualized whether plans had missing currency equivalents.",
        "High-Risk Unpublishing: 'Set Visibility' was a one-click row action sitting beside 'Delete' with no confirmation."
      ],
      personas: [
        { role: "Commercial Product Manager", desc: "Creates, prices, and publishes software tiers (Starter, Standard, Premium) and bundles." },
        { role: "Sales Executive", desc: "References active plan features, currency rates, and customer discount calculations." },
        { role: "Billing Specialist", desc: "Ensures every plan has valid billing periods (Monthly/Annual) and supported billing models before customer assignment." }
      ],
      functionalEpics: [
        {
          epicTitle: "Products & Plans Workspace (/crm/catalogue)",
          description: "Two-pane explorer with product sidebar and comparative plan cards.",
          requirements: [
            "Left Pane: Product tree listing all core software products.",
            "Right Pane: Selected product details, active plans displayed as side-by-side comparative cards with live badges.",
            "Inline Feature Matrix: Replaces legacy Product Captions with feature comparison checklist.",
            "Archived Clutter: Obsolete offers collapsed behind 'Show archived (25)' toggle."
          ]
        },
        {
          epicTitle: "5-Step Full-Page Plan Editor (/crm/catalogue/plans/[code])",
          description: "Full-page stepper route replacing cramped modal.",
          requirements: [
            "Step 1 Basics: Product, Plan Name, Code, Billing Model (PER_USER, PER_TRANSACTION, PERIODIC).",
            "Step 2 Features: Checklist of all product features.",
            "Step 3 Pricing Matrix: NGN (mandatory), USD, GBP across Monthly and Annually, with 10x autofill helper.",
            "Step 4 Trial & Extras: Free trial toggle, Recommended plan badge, priority rank.",
            "Step 5 Review & Publish: Live public pricing preview card rendering real-time toggle and savings badge."
          ]
        },
        {
          epicTitle: "Bundles Workspace & Editor (/crm/catalogue/bundles)",
          description: "Compose multi-product bundles, set seat limits, and calculate customer savings.",
          requirements: [
            "Select bundle group and pick at most one live plan per product using multi-select chips.",
            "Configure bundle pricing and automatic percentage savings calculation against individual plans.",
            "Configure min/max user licenses and storage allocation (GB/TB)."
          ]
        }
      ],
      techArchitecture: [
        "src/lib/mock/catalogue.ts: Plan, Bundle, Price, and Product domain models",
        "src/app/crm/catalogue/components/PlanEditor.tsx: 5-step stepper plan editor",
        "src/app/crm/catalogue/components/BundleEditor.tsx: Multi-product bundle editor",
        "src/app/crm/catalogue/pricing/page.tsx: Global pricing matrix with gap filter"
      ],
      nfrs: [
        "Live Preview Performance: Keystroke updates in Plan Editor pricing matrix must recompute live preview in < 5ms without re-rendering entire page.",
        "Data Integrity: Prices must be stored in standardized integer/decimal subunits (cents/kobo) to avoid floating-point math rounding errors.",
        "Audit Logging: Every plan publication or price change must log actor ID, previous price, and new price."
      ],
      dodList: [
        "A plan cannot be published without at least one valid price in the base currency (NGN).",
        "Clicking 'Fill empty annual prices' correctly multiplies monthly rates by 10 and populates annual fields.",
        "Attempting to archive a plan currently assigned to active customers displays a blocking dialog showing customer count.",
        "The bundle editor enforces selecting at most one plan per included product."
      ]
    }
  },
  {
    id: "sprint-3",
    sprintNum: 3,
    title: "Customer Management & Customer 360",
    subtitle: "Omni-search directory, health-aware 360 view, and 4-step onboarding",
    badge: "Core Ops",
    duration: "Week 4",
    status: "Planned",
    goal: "Transform customer records from static tables into an operational Customer 360 console with live health triage and end-to-end tenant onboarding.",
    businessValue: "Support and account reps can triage overdue renewals, review tickets, and safely manage tenants without opening 7 disjointed tabs.",
    leadIcon: Users,
    deliverables: [
    {
        "id": "s3-d1",
        "title": "Segmented Customer Directory",
        "description": "Real-time segments: Trials Ending, Renewal Overdue, Onboarding Stuck, Suspended, All 13,355.",
        "tags": [
            "Directory",
            "Segments",
            "Omni-Search"
        ],
        "story": {
            "id": "US-3.1",
            "title": "Real-Time Segmented Customer Directory",
            "asA": "Account Executive",
            "iWant": "a lightning-fast customer directory with omni-search and real-time operational segments",
            "soThat": "I can instantly find any customer by company name, domain, CICOD number, or phone",
            "acceptanceCriteria": [
                "Instant omni-search responds within < 200ms across 13,355 merchants.",
                "Segment chips filter by Trials Ending, Renewal Overdue, Onboarding Stuck, and Suspended.",
                "Health badges (Healthy, Due Soon, Overdue, Suspended) compute from subscription timestamps."
            ]
        },
        "tasks": [
            {
                "id": "s3-1",
                "title": "Build Customers directory with omni-search & segment pills",
                "desc": "Single query box across company, domain, CICOD #, email, phone with URL state.",
                "discipline": "frontend",
                "estimate": "L"
            },
            {
                "id": "s3-2",
                "title": "Compute Customer Health badges dynamically",
                "desc": "Derive Healthy, Trial, Due Soon, Overdue, Suspended from subscription timestamps.",
                "discipline": "frontend",
                "estimate": "M"
            },
            {
                "id": "s3-7",
                "title": "URL query parameter sync for customer search & active segment",
                "desc": "Persist customer search filters and segment selection in URL query params.",
                "discipline": "frontend",
                "estimate": "S"
            }
        ]
    },
    {
        "id": "s3-d2",
        "title": "Customer 360 Console",
        "description": "Summary strip (MRR, licenses, renewal), urgent alert banner, and 5 consolidated tabs.",
        "tags": [
            "Customer 360",
            "Health Badges",
            "Timeline"
        ],
        "story": {
            "id": "US-3.2",
            "title": "Comprehensive Customer 360 Workspace",
            "asA": "Customer Success Manager",
            "iWant": "a unified Customer 360 view with top KPI strip, urgent alerts banner, and 5 consolidated tabs",
            "soThat": "I have complete visibility into a customer's subscription, billing status, tickets, and user activity in one screen",
            "acceptanceCriteria": [
                "Summary strip highlights Plan, MRR, Seats used, Renewal date, and Last payment.",
                "Urgent banner surfaces overdue balances or pending dunning actions.",
                "5 tabs: Overview, Invoices & Billing, Users & Seats, Support Tickets, Activity Timeline."
            ]
        },
        "tasks": [
            {
                "id": "s3-3",
                "title": "Build Customer 360 header & summary KPI strip",
                "desc": "Display Plan, MRR, Users vs Seats, Next Renewal, Last Payment with status badge.",
                "discipline": "frontend",
                "estimate": "M"
            },
            {
                "id": "s3-4",
                "title": "Consolidate 7 tabs into 5 (Overview, Billing, Users, Tickets, Activity)",
                "desc": "Include unified Activity & Notes timeline and eliminate empty Addon placeholder.",
                "discipline": "frontend",
                "estimate": "XL"
            },
            {
                "id": "s3-6",
                "title": "Implement safe Suspend workflow with mandatory reason",
                "desc": "Move suspend into ⋯ menu with confirmation dialog logging note to timeline.",
                "discipline": "frontend",
                "estimate": "S"
            }
        ]
    },
    {
        "id": "s3-d3",
        "title": "4-Step New Customer Wizard",
        "description": "Business (domain check) → Primary Contact → Plan Selection → Review & Provision.",
        "tags": [
            "Onboarding",
            "Provisioning",
            "Wizard"
        ],
        "story": {
            "id": "US-3.3",
            "title": "Guided Tenant Onboarding & Plan Assignment",
            "asA": "Onboarding Coordinator",
            "iWant": "a 4-step wizard to register business info, primary contact, assign a live product plan, and provision tenant",
            "soThat": "new merchants are correctly onboarded with immediate billing capability and zero orphan records",
            "acceptanceCriteria": [
                "Step 1 validates company domain uniqueness before continuing.",
                "Step 2 creates primary admin contact with phone and role.",
                "Step 3 binds a live catalogue plan so the merchant is immediately billable.",
                "Step 4 summarizes and provisions the tenant with generated CICOD ID."
            ]
        },
        "tasks": [
            {
                "id": "s3-5",
                "title": "Implement 4-step New Customer onboarding wizard",
                "desc": "Connect business info directly to catalogue plan picker so customer is billable.",
                "discipline": "frontend",
                "estimate": "L"
            },
            {
                "id": "s3-8",
                "title": "Add domain availability check and company duplication filter",
                "desc": "Validate tenant domain and tax identification uniqueness before submission.",
                "discipline": "frontend",
                "estimate": "S"
            },
            {
                "id": "s3-9",
                "title": "Tenant provisioning REST integration & error handling",
                "desc": "Backend transactional tenant creation, license assignment, and audit log.",
                "discipline": "backend",
                "estimate": "M"
            }
        ]
    }
],
    tasks: [
    {
        "id": "s3-1",
        "title": "Build Customers directory with omni-search & segment pills",
        "desc": "Single query box across company, domain, CICOD #, email, phone with URL state.",
        "discipline": "frontend",
        "estimate": "L"
    },
    {
        "id": "s3-2",
        "title": "Compute Customer Health badges dynamically",
        "desc": "Derive Healthy, Trial, Due Soon, Overdue, Suspended from subscription timestamps.",
        "discipline": "frontend",
        "estimate": "M"
    },
    {
        "id": "s3-7",
        "title": "URL query parameter sync for customer search & active segment",
        "desc": "Persist customer search filters and segment selection in URL query params.",
        "discipline": "frontend",
        "estimate": "S"
    },
    {
        "id": "s3-3",
        "title": "Build Customer 360 header & summary KPI strip",
        "desc": "Display Plan, MRR, Users vs Seats, Next Renewal, Last Payment with status badge.",
        "discipline": "frontend",
        "estimate": "M"
    },
    {
        "id": "s3-4",
        "title": "Consolidate 7 tabs into 5 (Overview, Billing, Users, Tickets, Activity)",
        "desc": "Include unified Activity & Notes timeline and eliminate empty Addon placeholder.",
        "discipline": "frontend",
        "estimate": "XL"
    },
    {
        "id": "s3-6",
        "title": "Implement safe Suspend workflow with mandatory reason",
        "desc": "Move suspend into ⋯ menu with confirmation dialog logging note to timeline.",
        "discipline": "frontend",
        "estimate": "S"
    },
    {
        "id": "s3-5",
        "title": "Implement 4-step New Customer onboarding wizard",
        "desc": "Connect business info directly to catalogue plan picker so customer is billable.",
        "discipline": "frontend",
        "estimate": "L"
    },
    {
        "id": "s3-8",
        "title": "Add domain availability check and company duplication filter",
        "desc": "Validate tenant domain and tax identification uniqueness before submission.",
        "discipline": "frontend",
        "estimate": "S"
    },
    {
        "id": "s3-9",
        "title": "Tenant provisioning REST integration & error handling",
        "desc": "Backend transactional tenant creation, license assignment, and audit log.",
        "discipline": "backend",
        "estimate": "M"
    }
],
    apiContracts: [
      { endpoint: "/api/v2/customers?q={query}&segment={seg}&page={p}", method: "GET", desc: "Omni-search returning derived health, plan, and lifecycle stage." },
      { endpoint: "/api/v2/customers/{id}", method: "GET", desc: "Single Customer 360 graph including subscription, seats, and open tickets." },
      { endpoint: "/api/v2/customers", method: "POST", desc: "Provisions merchant tenant and binds initial product plan." },
      { endpoint: "/api/v2/customers/{id}/suspend", method: "POST", desc: "Suspends tenant; requires reason code and operator notes." }
    ],
    dod: [
      "Clicking any customer opens their specific CICOD number (no mock customer locking).",
      "Overdue renewals display prominent alert banner showing exact days past due.",
      "Suspending a customer requires selecting a reason and immediately records to Activity."
    ],
    risks: [
      "Over-fetching customer relationships in list view (must use lean list DTOs).",
      "Duplicate merchant domain registration during onboarding."
    ],
    prd: {
      version: "1.0.0",
      status: "Planned",
      targetTimeline: "Sprint 3 (Week 4)",
      docFileName: "Sprint_3_Customer_Management_Customer_360.md",
      stakeholders: ["Customer Success", "Technical Support", "Sales Operations", "Frontend & Backend Engineers"],
      problemStatement: [
        "Silent Search Failure: Legacy search did nothing unless a 'Filter Type' dropdown was manually picked first.",
        "Invisible Customer Health: A tenant whose renewal expired on 27 Aug 2026 still displayed a green 'Active' badge with no warning.",
        "Unusable Pagination: Pager rendered 134 buttons, and switching to 10 rows/page broke navigation past record #1,340 out of 13,355.",
        "Disconnected Detail View: 7 thin tabs, with plan, renewal, user seats, and tickets scattered across separate pages.",
        "Unsafe Suspension: 'Suspend Customer' was an unconfirmed green button placed directly next to 'Update Customer'.",
        "Incomplete Onboarding: The legacy 3-step creation form collected contact details but omitted plan selection, leaving new tenants unbillable."
      ],
      personas: [
        { role: "Customer Success Manager", desc: "Reviews at-risk merchants, tracks renewal dates, and monitors onboarding bottlenecks." },
        { role: "Support Operations Agent", desc: "Opens Customer 360 by CICOD number, inspects open tickets, active seats, and recent notes." },
        { role: "Risk & Collections Officer", desc: "Executes safe merchant suspensions with mandatory reason tracking." }
      ],
      functionalEpics: [
        {
          epicTitle: "Customer Directory with Omni-Search (/crm/customer-mgt/customers)",
          description: "Search across company, domain, CICOD #, email, phone with live operational segments.",
          requirements: [
            "Single query box across all attributes with 250ms debounce and no required filter type prerequisite.",
            "Operational segments: All (13,355), Trials Ending (12), Renewal Overdue (48), Onboarding Stuck (31), Suspended (210).",
            "Derived Health badges: Healthy, Trial (n days), Due Soon, Overdue (n days), Suspended.",
            "Two-line primary cell: Company + CICOD # on line 1, Contact on line 2."
          ]
        },
        {
          epicTitle: "Customer 360 View (/crm/customer-mgt/customers/[id])",
          description: "Unified operational cockpit with KPI summary strip and 5 consolidated tabs.",
          requirements: [
            "Dynamic ID lookup by CICOD Number or UUID, eliminating legacy mock locking.",
            "KPI Summary Strip: Plan, MRR, Users vs Licenses, Next Renewal, Last Payment.",
            "Urgent alert banner for overdue renewals with quick invoice CTAs.",
            "5 Consolidated Tabs: Overview (lifecycle stepper), Subscription & Billing, Users, Tickets, Activity & Notes timeline.",
            "Safe Suspend workflow moved to header ⋯ menu requiring reason code and audit notes."
          ]
        },
        {
          epicTitle: "4-Step New Customer Onboarding Wizard",
          description: "End-to-end merchant setup binding plans at creation time.",
          requirements: [
            "Step 1 Business Details: Company name, subdomain availability check, sector, business type.",
            "Step 2 Primary Contact: Contact name, work email, phone auto-normalizing to E.164 (+234...).",
            "Step 3 Plan Selection: Bundle group picker, plan selector, billing period, trial toggle, price preview.",
            "Step 4 Review & Provision: Summary screen that provisions tenant and redirects immediately to new Customer 360."
          ]
        }
      ],
      techArchitecture: [
        "src/lib/mock/customers.ts: Customer, Contact, Subscription, and Health domain models",
        "src/app/crm/customer-mgt/customers/page.tsx: Omni-search customer directory",
        "src/app/crm/customer-mgt/customers/[id]/components/CustomerView.tsx: Customer 360 view",
        "src/app/crm/customer-mgt/customers/components/AddCustomerWizard.tsx: 4-step onboarding wizard"
      ],
      nfrs: [
        "Search Response Time: Omni-search returns filtered results in < 200ms across 13,355 merchant database.",
        "Reliable Data Fetching: Customer 360 loads all 5 tabs in a single consolidated endpoint call, replacing legacy 5 separate redundant calls.",
        "Phone Normalization: All phone numbers strictly validated and stored as E.164 (+234...) preventing legacy malformed strings (ng9078520406)."
      ],
      dodList: [
        "Typing any valid CICOD number (e.g. 23488) immediately displays the matching merchant without requiring a dropdown selection.",
        "Clicking any customer in the list opens their specific profile, not a static mock entity.",
        "Customers past their renewal date display an 'Overdue' health badge and an urgent alert banner.",
        "Suspending a customer cannot be confirmed until both a reason code and notes are entered.",
        "Submitting the New Customer wizard successfully assigns a commercial plan and redirects to the new Customer 360."
      ]
    }
  },
  {
    id: "sprint-4",
    sprintNum: 4,
    title: "Billing, Payments, Collections & Dunning",
    subtitle: "Real transaction states, collections queue, and policy timeline builder",
    badge: "FinOps",
    duration: "Week 5",
    status: "Planned",
    goal: "Fix inaccurate payment reporting (87% hidden failures), provide offline payment reconciliation, and automate late-payment chasing via dunning rules.",
    businessValue: "Recovers overdue revenue, prevents accidental service suspension, and provides trustworthy financial metrics to leadership.",
    leadIcon: CreditCard,
    deliverables: [
    {
        "id": "s4-d1",
        "title": "Billing Overview & Executive Dashboard",
        "description": "Live KPIs: Total MRR, Outstanding Collections, Failed Transactions, Dunning Recovery Rate.",
        "tags": [
            "FinOps",
            "KPIs",
            "Revenue"
        ],
        "story": {
            "id": "US-4.1",
            "title": "Executive Financial Health & MRR Dashboard",
            "asA": "Chief Financial Officer",
            "iWant": "an executive billing dashboard with true MRR, outstanding receivables, failed payments count, and recovery rates",
            "soThat": "leadership can evaluate recurring cash flow and identify collection risks in real time",
            "acceptanceCriteria": [
                "Displays Total MRR, Outstanding Collections, Failed Transactions, and Dunning Recovery Rate.",
                "Month-over-month trends highlight revenue growth and churn risk.",
                "Visual distribution breakdown by payment channel (Card, Direct Debit, Bank Transfer)."
            ]
        },
        "tasks": [
            {
                "id": "s4-7",
                "title": "Build executive Billing Overview KPI cards and revenue charts",
                "desc": "Display monthly revenue run-rate, failed transactions count, and collection recovery trend.",
                "discipline": "frontend",
                "estimate": "M"
            },
            {
                "id": "s4-8",
                "title": "Implement financial aggregations endpoint for live billing metrics",
                "desc": "High-performance aggregation query calculating MRR and overdue balances across currencies.",
                "discipline": "backend",
                "estimate": "M"
            },
            {
                "id": "s4-9",
                "title": "Automated reconciliation test for multi-currency MRR calculation",
                "desc": "Validate currency rate conversion and zero double-counting on upgraded subscriptions.",
                "discipline": "qa",
                "estimate": "S"
            }
        ]
    },
    {
        "id": "s4-d2",
        "title": "Payments Console & Attempt Drawer",
        "description": "True statuses (Paid, Failed, Pending, Refunded), transaction retry grouping, payment link CTA.",
        "tags": [
            "Payments",
            "Audit",
            "Reconciliation"
        ],
        "story": {
            "id": "US-4.2",
            "title": "Real Payment Transaction Auditing & Retry History",
            "asA": "Billing Operations Specialist",
            "iWant": "a payments ledger displaying true gateway transaction states with expandable retry history drawers",
            "soThat": "I can explain payment failures to customers without guessing between gateway errors and bank declines",
            "acceptanceCriteria": [
                "True status pills: Paid (green), Failed (red), Pending (amber), Refunded (slate).",
                "Attempt drawer groups all retries under the parent order with error messages.",
                "Generate Payment Link CTA allows manual recovery over email or SMS."
            ]
        },
        "tasks": [
            {
                "id": "s4-1",
                "title": "Build Payments table with real statuses & attempt drawer",
                "desc": "Group retries under single orders; display gateway error codes and card info.",
                "discipline": "frontend",
                "estimate": "L"
            },
            {
                "id": "s4-10",
                "title": "Add payment link generation modal with copyable URL",
                "desc": "Create one-click recovery link for failed transactions with custom expiry window.",
                "discipline": "frontend",
                "estimate": "S"
            },
            {
                "id": "s4-11",
                "title": "Payment gateway webhook ingestion handler for state updates",
                "desc": "Asynchronously process payment gateway webhooks for charge success, decline, and chargebacks.",
                "discipline": "backend",
                "estimate": "L"
            }
        ]
    },
    {
        "id": "s4-d3",
        "title": "Collections & Dunning Policy Builder",
        "description": "Queue of overdue accounts, Record Offline Payment modal, and visual reminder timeline.",
        "tags": [
            "Collections",
            "Dunning",
            "Timeline"
        ],
        "story": {
            "id": "US-4.3",
            "title": "Automated Dunning Rules & Past-Grace Collections",
            "asA": "Credit Control Manager",
            "iWant": "a past-grace collections queue, offline payment recorder, and visual dunning reminder timeline builder",
            "soThat": "we can recover overdue subscriptions through scheduled automated reminders and manual bank reconciliation",
            "acceptanceCriteria": [
                "'Ready to suspend' queue isolates overdue merchants past grace threshold.",
                "Record Offline Payment validates teller reference, clears debt, and logs note.",
                "Dunning Policy editor provides visual day-by-day reminder timeline (SMS/Email)."
            ]
        },
        "tasks": [
            {
                "id": "s4-2",
                "title": "Build Collections workbench with 'Ready to suspend' queue",
                "desc": "Table of past-grace accounts requiring human suspension decisions.",
                "discipline": "frontend",
                "estimate": "M"
            },
            {
                "id": "s4-3",
                "title": "Implement 'Record Offline Payment' modal with bank reference",
                "desc": "Validate required reference, reconcile invoice, and clear overdue status.",
                "discipline": "frontend",
                "estimate": "M"
            },
            {
                "id": "s4-4",
                "title": "Build Dunning Policy editor with interactive timeline",
                "desc": "Drag/configure days before/after due date with SMS/email template bindings.",
                "discipline": "frontend",
                "estimate": "XL"
            },
            {
                "id": "s4-5",
                "title": "Create Dunning Policy coverage indicator",
                "desc": "Visual strip showing which billing models lack a live chasing policy.",
                "discipline": "frontend",
                "estimate": "S"
            },
            {
                "id": "s4-6",
                "title": "Implement Automated Dunning Cron & Webhook processor",
                "desc": "Nightly evaluation of grace periods and message dispatch queue.",
                "discipline": "backend",
                "estimate": "XL"
            }
        ]
    }
],
    tasks: [
    {
        "id": "s4-7",
        "title": "Build executive Billing Overview KPI cards and revenue charts",
        "desc": "Display monthly revenue run-rate, failed transactions count, and collection recovery trend.",
        "discipline": "frontend",
        "estimate": "M"
    },
    {
        "id": "s4-8",
        "title": "Implement financial aggregations endpoint for live billing metrics",
        "desc": "High-performance aggregation query calculating MRR and overdue balances across currencies.",
        "discipline": "backend",
        "estimate": "M"
    },
    {
        "id": "s4-9",
        "title": "Automated reconciliation test for multi-currency MRR calculation",
        "desc": "Validate currency rate conversion and zero double-counting on upgraded subscriptions.",
        "discipline": "qa",
        "estimate": "S"
    },
    {
        "id": "s4-1",
        "title": "Build Payments table with real statuses & attempt drawer",
        "desc": "Group retries under single orders; display gateway error codes and card info.",
        "discipline": "frontend",
        "estimate": "L"
    },
    {
        "id": "s4-10",
        "title": "Add payment link generation modal with copyable URL",
        "desc": "Create one-click recovery link for failed transactions with custom expiry window.",
        "discipline": "frontend",
        "estimate": "S"
    },
    {
        "id": "s4-11",
        "title": "Payment gateway webhook ingestion handler for state updates",
        "desc": "Asynchronously process payment gateway webhooks for charge success, decline, and chargebacks.",
        "discipline": "backend",
        "estimate": "L"
    },
    {
        "id": "s4-2",
        "title": "Build Collections workbench with 'Ready to suspend' queue",
        "desc": "Table of past-grace accounts requiring human suspension decisions.",
        "discipline": "frontend",
        "estimate": "M"
    },
    {
        "id": "s4-3",
        "title": "Implement 'Record Offline Payment' modal with bank reference",
        "desc": "Validate required reference, reconcile invoice, and clear overdue status.",
        "discipline": "frontend",
        "estimate": "M"
    },
    {
        "id": "s4-4",
        "title": "Build Dunning Policy editor with interactive timeline",
        "desc": "Drag/configure days before/after due date with SMS/email template bindings.",
        "discipline": "frontend",
        "estimate": "XL"
    },
    {
        "id": "s4-5",
        "title": "Create Dunning Policy coverage indicator",
        "desc": "Visual strip showing which billing models lack a live chasing policy.",
        "discipline": "frontend",
        "estimate": "S"
    },
    {
        "id": "s4-6",
        "title": "Implement Automated Dunning Cron & Webhook processor",
        "desc": "Nightly evaluation of grace periods and message dispatch queue.",
        "discipline": "backend",
        "estimate": "XL"
    }
],
    apiContracts: [
      { endpoint: "/api/v2/billing/overview", method: "GET", desc: "Returns aggregate MRR, failed transaction counts, and collections total." },
      { endpoint: "/api/v2/billing/payments", method: "GET", desc: "Filtered payments with grouped attempt history and true statuses." },
      { endpoint: "/api/v2/billing/payments/record-offline", method: "POST", desc: "Records manual bank transfer with mandatory teller/transaction ref." },
      { endpoint: "/api/v2/billing/dunning/policies", method: "GET", desc: "Lists policies with assigned billing model coverage map." }
    ],
    dod: [
      "Payments console shows true failed count matching payment gateway webhooks.",
      "Recording an offline payment removes customer from Collections queue immediately.",
      "Dunning steps cannot be saved with blank or unassigned communication templates."
    ],
    risks: [
      "Chasing customers who have already paid offline before reconciliation is logged.",
      "Accidental automated suspension of key VIP accounts (mitigated by 'Skip Paused')."
    ],
    prd: {
      version: "1.0.0",
      status: "Planned",
      targetTimeline: "Sprint 4 (Week 5)",
      docFileName: "Sprint_4_Billing_Payments_Collections_Dunning.md",
      stakeholders: ["Head of Finance", "Billing Specialists", "Credit Control / Collections Team", "Engineers"],
      problemStatement: [
        "False Transaction Statuses: The legacy subscription payments table marked every transaction as 'CONFIRMED' despite 87% having actually failed at the gateway.",
        "Broken Financial Aggregates: Totals on the screen did not match filtered results, and filtering by 'Pending' or 'Cancelled' returned null.",
        "Uncovered Late Payers: Dunning rules were only configured for 2 of 7 subscription models; the majority of late-paying merchants were never chased.",
        "Disjointed KCI Setup: Reminder steps ('KCI') were defined globally, attached on a different screen, and offsets were configured in two separate places.",
        "Disconnected Offline Payments: Bank transfer reconciliations had no dedicated workflow or mandatory transaction reference checks."
      ],
      personas: [
        { role: "Billing Operations Specialist", desc: "Monitors transaction failure rates, dispatches payment retry links, and records offline bank transfers." },
        { role: "Credit Control Officer", desc: "Reviews accounts past grace period in the Collections queue to approve or delay suspensions." },
        { role: "Finance Director", desc: "Inspects aggregate Monthly Recurring Revenue (MRR), overdue receivables, and automated dunning recovery rates." }
      ],
      functionalEpics: [
        {
          epicTitle: "Billing Overview & Executive Dashboard (/crm/billing)",
          description: "Live financial pulse metrics with interactive navigation into filtered queues.",
          requirements: [
            "Total Monthly Recurring Revenue (MRR): Normalized across active subscriptions.",
            "Outstanding Collections: Aggregate value of overdue invoices.",
            "Failed Payments (7-day): Count and value of failed automated card debits.",
            "Dunning Recovery Rate: Percentage of overdue invoices settled following dunning."
          ]
        },
        {
          epicTitle: "Payments Console (/crm/billing/payments)",
          description: "Accurate transaction states with attempt drawer and send payment link CTA.",
          requirements: [
            "True status badges: Paid (green), Failed (red), Pending (amber), Refunded (purple).",
            "Order retry grouping: Multiple automated card debit retries grouped under single Order ID.",
            "Attempt Detail Drawer: Timestamp, gateway response message, card last 4 digits, transaction reference.",
            "Send payment link CTA: Triggers email/SMS payment portal link to customer."
          ]
        },
        {
          epicTitle: "Collections Workbench & Offline Reconciliation (/crm/billing/collections)",
          description: "Triage queues and mandatory bank reference entry for manual transfers.",
          requirements: [
            "Filter tabs: All Overdue, In Grace Period, Ready to Suspend, Paused.",
            "Record Offline Payment modal: Amount, method, date, mandatory bank/teller reference, accounting notes.",
            "Submitting offline payment reconciles invoice, clears Collections queue, and resets health to Healthy.",
            "Pause/resume dunning chasing with required justification code."
          ]
        },
        {
          epicTitle: "Dunning Policy Builder (/crm/billing/dunning/[id])",
          description: "Visual timeline builder with template bindings and coverage indicator.",
          requirements: [
            "Coverage indicator: Displays ratio of billing models covered by active policy.",
            "Visual reminder timeline: Configure steps before/after due date with template assignments.",
            "Interactive message preview card rendering sample customer data.",
            "Grace period (0-30 days) and switches for auto-suspend, skip paused, and skip pending bank transfers."
          ]
        }
      ],
      techArchitecture: [
        "src/lib/mock/billing.ts: Payments, Invoices, Dunning Policies, and Collections data layer",
        "src/app/crm/billing/components/BillingOverview.tsx: Financial overview KPI cards",
        "src/app/crm/billing/components/CollectionsView.tsx: Collections queue and offline payment modal",
        "src/app/crm/billing/components/PolicyEditor.tsx: Dunning policy timeline editor"
      ],
      nfrs: [
        "Financial Auditability: Offline payment entries cannot be edited or deleted once recorded; adjustments must be logged as reversal entries.",
        "Webhook Processing Throughput: Gateway webhooks (payment.success, payment.failed) must process idempotently within < 500ms.",
        "Email/SMS Throttle: Automated dunning cron must not dispatch duplicate reminder messages within a 24-hour window."
      ],
      dodList: [
        "Payments console shows true failed count matching payment gateway webhooks.",
        "Recording an offline payment removes customer from Collections queue immediately.",
        "Dunning steps cannot be saved with blank or unassigned communication templates.",
        "Coverage strip reflects 100% when all billing models have active dunning policies."
      ]
    }
  },
  {
    id: "sprint-5",
    sprintNum: 5,
    title: "Growth Pipeline: Leads & Partners",
    subtitle: "Lead board by stage, conversion to customer, and partner verification",
    badge: "Sales & Channel",
    duration: "Week 6",
    status: "Planned",
    goal: "Connect marketing sign-ups to sales conversion, provide an interactive Kanban board, and streamline commercial partner verification and commission payouts.",
    businessValue: "Ensures no website lead is lost, shortens the sales cycle, and empowers partner affiliates (ICEs) with transparent commission earnings.",
    leadIcon: Target,
    deliverables: [
    {
        "id": "s5-d1",
        "title": "Interactive Leads Pipeline & Board",
        "description": "Dual table and Kanban board by stage (New → Qualified → Demo → Proposal → Won/Lost).",
        "tags": [
            "Leads",
            "Kanban",
            "Pipeline"
        ],
        "story": {
            "id": "US-5.1",
            "title": "Visual Drag-and-Drop Leads Kanban Pipeline",
            "asA": "Sales Representative",
            "iWant": "an interactive Kanban pipeline board with lead cards organized by stage from New to Won/Lost",
            "soThat": "I can visually prioritize my sales pipeline and drag deals forward as demos progress",
            "acceptanceCriteria": [
                "Stages: New, Qualified, Demo Scheduled, Proposal Sent, Won, Lost.",
                "Drag-and-drop moves cards between stages and prompts for lost reasons.",
                "Lead card displays contact name, deal value, days in stage, and last activity."
            ]
        },
        "tasks": [
            {
                "id": "s5-1",
                "title": "Build Leads directory with Unassigned sign-up segment",
                "desc": "Surface inbound website leads needing immediate sales rep allocation.",
                "discipline": "frontend",
                "estimate": "M"
            },
            {
                "id": "s5-2",
                "title": "Build interactive Drag-and-Drop Kanban pipeline board",
                "desc": "Allow dragging lead cards between stages with quick update modal.",
                "discipline": "frontend",
                "estimate": "L"
            },
            {
                "id": "s5-6",
                "title": "Lead activity log and qualification note modal",
                "desc": "Capture call notes, next steps, and estimated budget directly on lead record.",
                "discipline": "frontend",
                "estimate": "S"
            }
        ]
    },
    {
        "id": "s5-d2",
        "title": "One-Click 'Convert to Customer' Workflow",
        "description": "Converts qualified leads into onboarded merchant tenants with prefilled wizard.",
        "tags": [
            "Conversion",
            "Workflow",
            "Wizard"
        ],
        "story": {
            "id": "US-5.2",
            "title": "Seamless Won Deal to Tenant Conversion",
            "asA": "Sales Account Executive",
            "iWant": "a one-click Convert to Customer workflow that transfers lead details directly into the tenant onboarding wizard",
            "soThat": "I can close deals and activate merchant accounts without manual copy-pasting",
            "acceptanceCriteria": [
                "Clicking Convert transfers company, contact email, and plan preference.",
                "Automatically marks the parent lead as 'Won' upon successful provisioning.",
                "Creates initial billing invoice based on negotiated commercial terms."
            ]
        },
        "tasks": [
            {
                "id": "s5-3",
                "title": "Implement 'Convert to Customer' action",
                "desc": "Prefill New Customer wizard and link newly generated tenant to Won lead.",
                "discipline": "frontend",
                "estimate": "M"
            },
            {
                "id": "s5-7",
                "title": "Stage update API with mandatory Lost reason capture",
                "desc": "Validate that marking a lead as Lost requires a drop-down categorization and notes.",
                "discipline": "backend",
                "estimate": "S"
            },
            {
                "id": "s5-8",
                "title": "E2E conversion validation from web sign-up to billable customer",
                "desc": "Verify seamless data flow from inbound lead to active Customer 360 profile.",
                "discipline": "qa",
                "estimate": "S"
            }
        ]
    },
    {
        "id": "s5-d3",
        "title": "Partners Management & Verification Queue",
        "description": "Manage ICEs, business partners, and delivery affiliates with dedicated verification review.",
        "tags": [
            "Partners",
            "Affiliates",
            "Verification"
        ],
        "story": {
            "id": "US-5.3",
            "title": "Partner Verification & Channel Network Review",
            "asA": "Channel Partnerships Director",
            "iWant": "a dedicated Partner directory and verification queue to review affiliate applications and documents",
            "soThat": "we can onboard verified ICE affiliates and resellers while preventing fraudulent partner signups",
            "acceptanceCriteria": [
                "Review queue displays registration documents, business registration, and bank details.",
                "Actions: Approve, Request Additional Documents, or Reject with comment.",
                "Approved partners receive auto-generated referral code and portal login."
            ]
        },
        "tasks": [
            {
                "id": "s5-4",
                "title": "Build Partners list with Verification Queue",
                "desc": "Review partner registration KYC documents; approve or reject with reason.",
                "discipline": "frontend",
                "estimate": "L"
            },
            {
                "id": "s5-9",
                "title": "Partner KYC document previewer and approval workflow",
                "desc": "Modal showing uploaded certificate and bank details with approve/reject CTAs.",
                "discipline": "frontend",
                "estimate": "M"
            },
            {
                "id": "s5-10",
                "title": "Partner verification REST endpoints with audit logging",
                "desc": "Endpoint approving partner status and dispatching welcome credentials.",
                "discipline": "backend",
                "estimate": "M"
            }
        ]
    },
    {
        "id": "s5-d4",
        "title": "Commission Plans with Worked Examples",
        "description": "Transparent percentage/fixed rules with concrete payout calculations.",
        "tags": [
            "Commissions",
            "Payouts",
            "Formulas"
        ],
        "story": {
            "id": "US-5.4",
            "title": "Transparent Partner Commission Engine",
            "asA": "Partner Affiliate (ICE)",
            "iWant": "transparent commission plans displaying percentage/fixed rules with concrete worked payout calculations",
            "soThat": "I can understand exactly how much I earn on merchant license referrals and renewals",
            "acceptanceCriteria": [
                "Displays formula breakdown with worked numerical examples.",
                "Supports recurring revenue share vs one-time bounty rules.",
                "Monthly payout statements summarize eligible vs pending commission balances."
            ]
        },
        "tasks": [
            {
                "id": "s5-5",
                "title": "Build Commission Plans card view",
                "desc": "Display formula breakdown with worked examples (e.g. ₦8,000 paid = ₦240 earned).",
                "discipline": "frontend",
                "estimate": "M"
            },
            {
                "id": "s5-11",
                "title": "Monthly partner commission calculation ledger and payout export",
                "desc": "Calculate monthly eligible payout balances and generate finance settlement CSV.",
                "discipline": "backend",
                "estimate": "M"
            },
            {
                "id": "s5-12",
                "title": "Commission calculation automated unit test suite",
                "desc": "Test edge cases: partial payments, refunds, and tier-based percentage scaling.",
                "discipline": "qa",
                "estimate": "S"
            }
        ]
    }
],
    tasks: [
    {
        "id": "s5-1",
        "title": "Build Leads directory with Unassigned sign-up segment",
        "desc": "Surface inbound website leads needing immediate sales rep allocation.",
        "discipline": "frontend",
        "estimate": "M"
    },
    {
        "id": "s5-2",
        "title": "Build interactive Drag-and-Drop Kanban pipeline board",
        "desc": "Allow dragging lead cards between stages with quick update modal.",
        "discipline": "frontend",
        "estimate": "L"
    },
    {
        "id": "s5-6",
        "title": "Lead activity log and qualification note modal",
        "desc": "Capture call notes, next steps, and estimated budget directly on lead record.",
        "discipline": "frontend",
        "estimate": "S"
    },
    {
        "id": "s5-3",
        "title": "Implement 'Convert to Customer' action",
        "desc": "Prefill New Customer wizard and link newly generated tenant to Won lead.",
        "discipline": "frontend",
        "estimate": "M"
    },
    {
        "id": "s5-7",
        "title": "Stage update API with mandatory Lost reason capture",
        "desc": "Validate that marking a lead as Lost requires a drop-down categorization and notes.",
        "discipline": "backend",
        "estimate": "S"
    },
    {
        "id": "s5-8",
        "title": "E2E conversion validation from web sign-up to billable customer",
        "desc": "Verify seamless data flow from inbound lead to active Customer 360 profile.",
        "discipline": "qa",
        "estimate": "S"
    },
    {
        "id": "s5-4",
        "title": "Build Partners list with Verification Queue",
        "desc": "Review partner registration KYC documents; approve or reject with reason.",
        "discipline": "frontend",
        "estimate": "L"
    },
    {
        "id": "s5-9",
        "title": "Partner KYC document previewer and approval workflow",
        "desc": "Modal showing uploaded certificate and bank details with approve/reject CTAs.",
        "discipline": "frontend",
        "estimate": "M"
    },
    {
        "id": "s5-10",
        "title": "Partner verification REST endpoints with audit logging",
        "desc": "Endpoint approving partner status and dispatching welcome credentials.",
        "discipline": "backend",
        "estimate": "M"
    },
    {
        "id": "s5-5",
        "title": "Build Commission Plans card view",
        "desc": "Display formula breakdown with worked examples (e.g. ₦8,000 paid = ₦240 earned).",
        "discipline": "frontend",
        "estimate": "M"
    },
    {
        "id": "s5-11",
        "title": "Monthly partner commission calculation ledger and payout export",
        "desc": "Calculate monthly eligible payout balances and generate finance settlement CSV.",
        "discipline": "backend",
        "estimate": "M"
    },
    {
        "id": "s5-12",
        "title": "Commission calculation automated unit test suite",
        "desc": "Test edge cases: partial payments, refunds, and tier-based percentage scaling.",
        "discipline": "qa",
        "estimate": "S"
    }
],
    apiContracts: [
      { endpoint: "/api/v2/growth/leads", method: "GET", desc: "Paginated leads with stage, assigned owner, and source channel." },
      { endpoint: "/api/v2/growth/leads/{id}/stage", method: "PATCH", desc: "Updates pipeline stage; captures reason if marked Lost." },
      { endpoint: "/api/v2/growth/leads/{id}/convert", method: "POST", desc: "Transforms lead into customer account, returning new customer ID." },
      { endpoint: "/api/v2/growth/partners/verify", method: "POST", desc: "Approves or rejects partner application with staff comments." }
    ],
    dod: [
      "Dragging a lead to 'Lost' prompts for mandatory loss reason.",
      "Converting a lead navigates directly to Customer 360 with preserved data.",
      "Commission card displays clear math examples preventing unit misunderstandings."
    ],
    risks: [
      "Lead conversion creating duplicate tenant profiles.",
      "Commission rate adjustments affecting historical unfinalized payouts."
    ],
    prd: {
      version: "1.0.0",
      status: "Planned",
      targetTimeline: "Sprint 5 (Week 6)",
      docFileName: "Sprint_5_Growth_Pipeline_Leads_Partners.md",
      stakeholders: ["Sales Leads", "Account Executives", "Partner Channel Managers", "Frontend & Backend Engineers"],
      problemStatement: [
        "Broken Leads Module: The legacy /crm/lead endpoint threw API error 400 and never loaded; create form had 17 fields.",
        "Fragmented Prospects vs. Leads: Prospects lived in a separate screen (/crm/account/view-prospect) which crashed with HTTP 500.",
        "No Link to Onboarded Customers: Converting a lead was impossible; reps had to manually re-type customer details.",
        "Overwhelmed Partner Directory: 400 commercial partners listed without verification queues, and delivery partners couldn't be created.",
        "Ambiguous Commission Plans: Commission rates were recorded as dimensionless numbers like 'PERCENT 0.3' with no units."
      ],
      personas: [
        { role: "Inbound Sales Representative", desc: "Claims unassigned website sign-ups, logs call activity, and qualifies prospective merchants." },
        { role: "Sales Director", desc: "Monitors stage distribution across the pipeline and reassigns lead owners." },
        { role: "Partner Channel Manager", desc: "Verifies ICE and Business Partner applications, validating KYC compliance." }
      ],
      functionalEpics: [
        {
          epicTitle: "Leads Pipeline & Interactive Board (/crm/growth/leads)",
          description: "Dual table and Kanban drag-and-drop board across sales pipeline stages.",
          requirements: [
            "Table view and Kanban board view with stages: New → Qualified → Presentation → Proposal → Won / Lost.",
            "Drag-and-drop moves lead card between stages with optimistic UI updates.",
            "Segments: All Open, Unassigned, My Leads, Follow-up Due, Won, Lost.",
            "Create Lead drawer with compact fields replacing legacy 17-field form."
          ]
        },
        {
          epicTitle: "One-Click 'Convert to Customer' Workflow",
          description: "Prefills New Customer Wizard and establishes foreign key link to Won lead.",
          requirements: [
            "Convert button opens onboarding wizard prefilled with company name, contact, email, and phone.",
            "Submitting wizard creates active customer tenant, sets lead to Won, and links customer ID."
          ]
        },
        {
          epicTitle: "Partner Management & Verification Queue (/crm/growth/partners)",
          description: "Categorized partner management with KYC verification approval workflows.",
          requirements: [
            "Manage ICEs (affiliates), Business Partners (resellers), and Delivery Partners.",
            "Pending Verification queue allows reviewing documents and approving/rejecting with logged feedback.",
            "Partner detail view displays referred merchants, total GMV, and accrued commission earnings."
          ]
        },
        {
          epicTitle: "Commission Plans with Worked Examples (/crm/growth/commission)",
          description: "Transparent percentage/fixed rules with concrete payout calculations.",
          requirements: [
            "Configuration cards per partner type with explicit unit labels (% vs fixed).",
            "Worked example display: 'When customer pays ₦8,000/month, partner earns ₦240 (3%) per billing cycle.'"
          ]
        }
      ],
      techArchitecture: [
        "src/lib/mock/growth.ts: Leads, Partners, Commissions, and Campaigns data models",
        "src/app/crm/growth/leads/page.tsx: Table and Kanban lead board views",
        "src/app/crm/growth/partners/page.tsx: Partner directory and verification queue",
        "src/app/crm/growth/commission/page.tsx: Commission plan cards with worked examples"
      ],
      nfrs: [
        "Kanban Drag Responsiveness: Card position optimistic updates on drag end, syncing with API in < 150ms.",
        "Referral Code Integrity: Partner referral codes must be unique, case-insensitive, and cryptographically collision-resistant.",
        "Conversion Auditability: Once a lead is converted, historical notes and touchpoints are copied into the customer's Activity timeline."
      ],
      dodList: [
        "Dragging a lead card to the 'Lost' column requires selecting a loss reason before completing the move.",
        "Clicking 'Convert to Customer' pre-fills the onboarding wizard, provisions the tenant, and links the Won lead.",
        "Partner verification requires human review and confirmation; status changes cannot occur via single-click accidental toggles.",
        "Commission card displays clear math examples preventing unit misunderstandings."
      ]
    }
  },
  {
    id: "sprint-6",
    sprintNum: 6,
    title: "Messaging, Campaigns & Trigger Engine",
    subtitle: "Unified template library, 5-step campaign builder, and event triggers",
    badge: "Marketing",
    duration: "Week 7",
    status: "Planned",
    goal: "Unify marketing outreach and automated transactional notifications into one shared template library with live variable tags and multi-step campaign scheduling.",
    businessValue: "Eliminates embarrassing template errors and gives marketing precise audience segmentation.",
    leadIcon: MessageSquare,
    deliverables: [
    {
        "id": "s6-d1",
        "title": "Shared Template Library",
        "description": "Centralized SMS and Email templates used by both Campaigns and Dunning.",
        "tags": [
            "Templates",
            "Email/SMS"
        ],
        "story": {
            "id": "US-6.1",
            "title": "Unified Multichannel Template Authoring",
            "asA": "Marketing & Communications Specialist",
            "iWant": "a unified template library for SMS and Email messages with variable placeholder chips and character counters",
            "soThat": "marketing campaigns and automated dunning notices share brand-approved, error-free copy",
            "acceptanceCriteria": [
                "Channel filter for SMS vs Email with variable tags ({{customer_name}}, {{due_date}}).",
                "SMS editor calculates exact character count and segment billing (160 chars/SMS).",
                "Flags warnings if templates contain invalid or unmapped variable tags."
            ]
        },
        "tasks": [
            {
                "id": "s6-1",
                "title": "Build Template Library with channel filters & usage badges",
                "desc": "Flag mismatches (e.g. warning when billing dunning uses marketing template).",
                "discipline": "frontend",
                "estimate": "L"
            },
            {
                "id": "s6-2",
                "title": "Implement variable placeholder chips & SMS character counter",
                "desc": "One-click chip insertion ({{customer_name}}, {{due_date}}) with segment count.",
                "discipline": "frontend",
                "estimate": "M"
            },
            {
                "id": "s6-6",
                "title": "Rich HTML email preview drawer with desktop/mobile switcher",
                "desc": "Render preview iframe toggling between 375px phone and 600px desktop email views.",
                "discipline": "frontend",
                "estimate": "M"
            }
        ]
    },
    {
        "id": "s6-d2",
        "title": "5-Step Campaign Builder",
        "description": "Basics → Audience Segmentation → Message → Schedule → Review & Launch.",
        "tags": [
            "Campaigns",
            "Segmentation"
        ],
        "story": {
            "id": "US-6.2",
            "title": "Targeted Audience Campaign Scheduling",
            "asA": "Growth Marketing Lead",
            "iWant": "a 5-step wizard to target audience segments, select templates, schedule delivery, and review performance funnels",
            "soThat": "I can launch targeted retention or promo campaigns and measure conversion results",
            "acceptanceCriteria": [
                "5 steps: Basics → Audience Query → Message Selection → Schedule → Launch.",
                "Real-time estimated recipient count before dispatch.",
                "Campaign reporting dashboard displays Sent, Delivered, Opened, and Converted funnels."
            ]
        },
        "tasks": [
            {
                "id": "s6-3",
                "title": "Build 5-step Campaign Builder wizard",
                "desc": "Filter audience by customer segment, partner type, or pipeline stage.",
                "discipline": "frontend",
                "estimate": "XL"
            },
            {
                "id": "s6-4",
                "title": "Build Campaign Results funnel visualization",
                "desc": "Sent → Delivered → Opened → Converted metrics with exportable report.",
                "discipline": "frontend",
                "estimate": "M"
            },
            {
                "id": "s6-7",
                "title": "Campaign batch dispatch queue worker and throttling logic",
                "desc": "Backend worker scheduling outbound SMS/Email dispatch through gateway provider.",
                "discipline": "backend",
                "estimate": "L"
            }
        ]
    },
    {
        "id": "s6-d3",
        "title": "Automated Event Notification Triggers",
        "description": "Bind system events (Trial ending, Payment failed) to communication rules.",
        "tags": [
            "Triggers",
            "Automation"
        ],
        "story": {
            "id": "US-6.3",
            "title": "Lifecycle Event Notification Automation",
            "asA": "Product Operations Specialist",
            "iWant": "a system trigger console to map lifecycle events (Trial Ending, Invoice Overdue) to automatic communication rules",
            "soThat": "critical customer lifecycle events notify merchants automatically without manual staff intervention",
            "acceptanceCriteria": [
                "Supported triggers: Trial Ending (3 days), Payment Succeeded, Renewal Overdue, Tenant Suspended.",
                "Allows toggling triggers on/off and selecting approved template.",
                "Execution log records notification dispatch history and delivery receipts."
            ]
        },
        "tasks": [
            {
                "id": "s6-5",
                "title": "Build System Notification Triggers view",
                "desc": "Toggle automated notifications on/off per event with template selection.",
                "discipline": "frontend",
                "estimate": "M"
            },
            {
                "id": "s6-8",
                "title": "Event bus webhook listener triggering message dispatch",
                "desc": "Subscribe to billing and onboarding domain events to trigger associated templates.",
                "discipline": "backend",
                "estimate": "L"
            },
            {
                "id": "s6-9",
                "title": "Trigger delivery fallback and failure retry handler",
                "desc": "Automatic secondary channel retry (e.g. SMS fallback on undelivered email).",
                "discipline": "backend",
                "estimate": "M"
            }
        ]
    }
],
    tasks: [
    {
        "id": "s6-1",
        "title": "Build Template Library with channel filters & usage badges",
        "desc": "Flag mismatches (e.g. warning when billing dunning uses marketing template).",
        "discipline": "frontend",
        "estimate": "L"
    },
    {
        "id": "s6-2",
        "title": "Implement variable placeholder chips & SMS character counter",
        "desc": "One-click chip insertion ({{customer_name}}, {{due_date}}) with segment count.",
        "discipline": "frontend",
        "estimate": "M"
    },
    {
        "id": "s6-6",
        "title": "Rich HTML email preview drawer with desktop/mobile switcher",
        "desc": "Render preview iframe toggling between 375px phone and 600px desktop email views.",
        "discipline": "frontend",
        "estimate": "M"
    },
    {
        "id": "s6-3",
        "title": "Build 5-step Campaign Builder wizard",
        "desc": "Filter audience by customer segment, partner type, or pipeline stage.",
        "discipline": "frontend",
        "estimate": "XL"
    },
    {
        "id": "s6-4",
        "title": "Build Campaign Results funnel visualization",
        "desc": "Sent → Delivered → Opened → Converted metrics with exportable report.",
        "discipline": "frontend",
        "estimate": "M"
    },
    {
        "id": "s6-7",
        "title": "Campaign batch dispatch queue worker and throttling logic",
        "desc": "Backend worker scheduling outbound SMS/Email dispatch through gateway provider.",
        "discipline": "backend",
        "estimate": "L"
    },
    {
        "id": "s6-5",
        "title": "Build System Notification Triggers view",
        "desc": "Toggle automated notifications on/off per event with template selection.",
        "discipline": "frontend",
        "estimate": "M"
    },
    {
        "id": "s6-8",
        "title": "Event bus webhook listener triggering message dispatch",
        "desc": "Subscribe to billing and onboarding domain events to trigger associated templates.",
        "discipline": "backend",
        "estimate": "L"
    },
    {
        "id": "s6-9",
        "title": "Trigger delivery fallback and failure retry handler",
        "desc": "Automatic secondary channel retry (e.g. SMS fallback on undelivered email).",
        "discipline": "backend",
        "estimate": "M"
    }
],
    apiContracts: [
      { endpoint: "/api/v2/messaging/templates", method: "GET", desc: "List templates with category, channel, and active usage matrix." },
      { endpoint: "/api/v2/campaigns", method: "POST", desc: "Creates campaign draft with audience query filters and message body." },
      { endpoint: "/api/v2/campaigns/{id}/launch", method: "POST", desc: "Dispatches campaign job to message broker after confirmation." },
      { endpoint: "/api/v2/settings/triggers", method: "GET", desc: "Configured event notification bindings." }
    ],
    dod: [
      "Template editor warns if placeholder variable is missing from target trigger payload.",
      "Campaign launch is blocked until audience estimation returns > 0 recipients.",
      "SMS message preview shows exact segment breakdown (160 characters per SMS)."
    ],
    risks: [
      "High SMS provider costs if audience segmentation is too broad.",
      "Email deliverability/spam flagging if template unsubscription link is omitted."
    ],
    prd: {
      version: "1.0.0",
      status: "Planned",
      targetTimeline: "Sprint 6 (Week 7)",
      docFileName: "Sprint_6_Messaging_Campaigns_Trigger_Engine.md",
      stakeholders: ["Marketing Directors", "Growth Leads", "Operations Engineers", "Developers"],
      problemStatement: [
        "Non-functional Campaigns: Legacy campaigns were just a name and two dates—no audience, no message body, and no analytics.",
        "Embarrassing Template Mismatches: The sole communication template used for overdue dunning said 'Thank you for your order'.",
        "Broken Triggers: System triggers (/crm/app-configuration Triggers tab) crashed with error 400.",
        "Unworked Subscribers: 34 website newsletter sign-ups sat in an unworked, static table without conversion workflows."
      ],
      personas: [
        { role: "Growth Marketing Manager", desc: "Drafts promotional outreach, defines targeted audience segments, and analyzes delivery funnels." },
        { role: "Operations Coordinator", desc: "Ensures transactional templates have clear, professional language and accurate variable tags." },
        { role: "Inbound Lead Specialist", desc: "Converts website newsletter subscribers into active CRM pipeline leads." }
      ],
      functionalEpics: [
        {
          epicTitle: "Shared Communication Template Library (/crm/growth/messaging)",
          description: "Centralized SMS and Email templates shared between marketing and dunning.",
          requirements: [
            "Categorization: Billing, Marketing, Onboarding, Transactional.",
            "Variable placeholder chips: {{customer_name}}, {{company}}, {{due_date}}, {{amount}}, {{payment_link}}.",
            "Live SMS character counter and segment breakdown (160 characters per SMS credit).",
            "Mismatch warning banner when billing dunning uses marketing promotional copy."
          ]
        },
        {
          epicTitle: "5-Step Campaign Builder (/crm/growth/campaigns/new)",
          description: "Step-by-step wizard for segmented email and SMS broadcast campaigns.",
          requirements: [
            "Step 1 Basics: Name, objective, channel.",
            "Step 2 Audience: Segment by customer sector/plan, partner type, or pipeline stage with live recipient count.",
            "Step 3 Message: Template selection or custom copy with mobile preview.",
            "Step 4 Schedule: Send immediately or schedule future dispatch.",
            "Step 5 Review & Launch: Confirmation modal explicitly stating recipient count before dispatch."
          ]
        },
        {
          epicTitle: "System Event Notification Triggers (/crm/settings/notifications)",
          description: "Bind core lifecycle events to automated notifications.",
          requirements: [
            "Events: customer.created, trial.ending, payment.failed, subscription.suspended.",
            "Configure on/off, channel, template, and staff notification CC lists."
          ]
        }
      ],
      techArchitecture: [
        "src/lib/mock/messaging.ts: Template library, placeholders, and subscriber models",
        "src/app/crm/growth/messaging/page.tsx: Shared communication template manager",
        "src/app/crm/growth/campaigns/page.tsx: Campaign directory and builder wizard",
        "src/app/crm/settings/components/NotificationsView.tsx: Event notification trigger settings"
      ],
      nfrs: [
        "Message Broker Architecture: Campaign dispatch jobs must be queued asynchronously (RabbitMQ / Redis BullMQ) to prevent blocking HTTP threads.",
        "Variable Injection Safety: Template variable parser must HTML-escape all user inputs to prevent XSS injection attacks in email clients.",
        "Opt-out Compliance: All outbound marketing emails must automatically append standard RFC-compliant one-click unsubscribe headers and footer links."
      ],
      dodList: [
        "The template library clearly distinguishes between Billing and Marketing templates, flagging dangerous cross-assignments.",
        "The SMS editor calculates character count and segment usage in real time.",
        "Launching a campaign is strictly blocked if the target audience query yields 0 recipients.",
        "Inbound website subscribers can be converted into active leads with a single click."
      ]
    }
  },
  {
    id: "sprint-7",
    sprintNum: 7,
    title: "Administration, RBAC, Keys & Audit Logging",
    subtitle: "Fine-grained permissions, API key management, and immutable audit trail",
    badge: "Security & Governance",
    duration: "Week 8",
    status: "Planned",
    goal: "Implement enterprise access control, eliminate legacy '68 of 70 staff are ADMIN' vulnerability, provide secure API key generation, and log all sensitive actions.",
    businessValue: "Meets SOC2/ISO enterprise security standards, protects merchant data, and prevents unauthorized system modifications.",
    leadIcon: ShieldAlert,
    deliverables: [
    {
        "id": "s7-d1",
        "title": "User Management & Role Assignment",
        "description": "Active, Invited, Inactive 90+ days, Deactivated. Role change impact diff modal.",
        "tags": [
            "Users",
            "RBAC"
        ],
        "story": {
            "id": "US-7.1",
            "title": "Staff User Directory & Least-Privilege Role Assignment",
            "asA": "Enterprise IT Security Manager",
            "iWant": "a staff user directory with active status tabs, 90-day inactive review, and role change diff confirmation",
            "soThat": "I can enforce the principle of least privilege and eliminate dormant staff accounts",
            "acceptanceCriteria": [
                "Tabs: Active, Invited, Inactive 90+ days, Deactivated.",
                "Role change modal displays visual diff of gained/revoked permissions before saving.",
                "Self-deactivation is strictly prohibited."
            ]
        },
        "tasks": [
            {
                "id": "s7-1",
                "title": "Build Users list with status tabs & stale user review",
                "desc": "Highlight staff not logged in for 90+ days; provide soft deactivation.",
                "discipline": "frontend",
                "estimate": "M"
            },
            {
                "id": "s7-2",
                "title": "Implement 'Change Role' dialog with permission diff",
                "desc": "Clearly show what capabilities the user gains or loses before saving.",
                "discipline": "frontend",
                "estimate": "M"
            },
            {
                "id": "s7-7",
                "title": "Automated stale user detection and notification job",
                "desc": "Cron flag marking inactive staff accounts for quarterly access recertification.",
                "discipline": "backend",
                "estimate": "S"
            }
        ]
    },
    {
        "id": "s7-d2",
        "title": "Role & Permission Matrix",
        "description": "Granular access configuration for Admin, Billing Ops, Sales Rep, Support, Viewer.",
        "tags": [
            "Permissions",
            "Security"
        ],
        "story": {
            "id": "US-7.2",
            "title": "Granular Role & Permission Access Control Matrix",
            "asA": "Compliance Officer",
            "iWant": "a granular Roles & Permissions matrix editor to define Create, Read, Update, Delete access per CRM module",
            "soThat": "staff access is restricted strictly to their job function without universal Super Admin access",
            "acceptanceCriteria": [
                "Preconfigured roles: Super Admin, Billing Ops, Sales Rep, Customer Support, Read-Only Viewer.",
                "Matrix controls access across Customers, Catalogue, Billing, Growth, and Settings.",
                "Custom role creation validates that at least one system admin role is preserved."
            ]
        },
        "tasks": [
            {
                "id": "s7-3",
                "title": "Build Roles & Permissions matrix editor",
                "desc": "Tabular matrix of areas (Customers, Billing, Catalogue) vs CRUD permissions.",
                "discipline": "frontend",
                "estimate": "L"
            },
            {
                "id": "s7-6",
                "title": "Implement centralized Audit Interceptor & RBAC middleware",
                "desc": "Backend middleware enforcing permission tokens and appending audit rows.",
                "discipline": "backend",
                "estimate": "XL"
            },
            {
                "id": "s7-8",
                "title": "RBAC authorization matrix unit test suite",
                "desc": "Verify route access blocks for non-permitted roles across 25 endpoints.",
                "discipline": "qa",
                "estimate": "S"
            }
        ]
    },
    {
        "id": "s7-d3",
        "title": "Merchant API Key Lifecycle",
        "description": "Select merchant, generate key shown once with copy CTA, store masked, revoke with reason.",
        "tags": [
            "API Keys",
            "Security"
        ],
        "story": {
            "id": "US-7.3",
            "title": "Secure Developer API Key Generation & Masking",
            "asA": "Platform Integration Engineer",
            "iWant": "a secure API key generator for merchant integrations with one-time reveal modal and masked storage",
            "soThat": "developers can integrate with CICOD CRM APIs without plaintext secrets leaking in databases",
            "acceptanceCriteria": [
                "Generates cryptographically secure API keys displayed in full only once.",
                "Stored and displayed as masked strings (••••••••ABCD) on subsequent views.",
                "Revocation modal requires mandatory reason code and immediately invalidates bearer tokens."
            ]
        },
        "tasks": [
            {
                "id": "s7-4",
                "title": "Build Merchant API Key generator with one-time view modal",
                "desc": "Display full secret once; list keys masked (••••ABCD) with revoke modal.",
                "discipline": "frontend",
                "estimate": "M"
            },
            {
                "id": "s7-9",
                "title": "API key hashing, encryption at rest, and instant token revocation",
                "desc": "HMAC hashing and database storage of merchant API keys with revocation check.",
                "discipline": "backend",
                "estimate": "M"
            },
            {
                "id": "s7-10",
                "title": "API Key authentication middleware and rate-limiting tests",
                "desc": "Test bearer token validation and 100 req/min rate limits per merchant.",
                "discipline": "qa",
                "estimate": "S"
            }
        ]
    },
    {
        "id": "s7-d4",
        "title": "System Audit Log & Compliance Export",
        "description": "Immutable record of Actor, Event, Entity, Diff, and Timestamp with CSV download.",
        "tags": [
            "Audit Log",
            "Compliance"
        ],
        "story": {
            "id": "US-7.4",
            "title": "Immutable Audit Trail & Regulatory CSV Export",
            "asA": "Security Auditor",
            "iWant": "an immutable, tamper-evident System Audit Log recording every sensitive mutation with before/after diffs",
            "soThat": "our organization complies with regulatory standards and can audit unauthorized data modifications",
            "acceptanceCriteria": [
                "Captures Actor, Event, Entity ID, IP address, Timestamp, and before/after JSON diff.",
                "Filter by date range, actor, entity type, and severity.",
                "Export to CSV/JSON for external compliance audits."
            ]
        },
        "tasks": [
            {
                "id": "s7-5",
                "title": "Build System Audit Log table with filter & CSV export",
                "desc": "Queryable timeline of system changes with expandable JSON payload diffs.",
                "discipline": "frontend",
                "estimate": "L"
            },
            {
                "id": "s7-11",
                "title": "Expandable JSON payload diff visualizer for audit rows",
                "desc": "Visual comparison of modified database records highlighting changed fields.",
                "discipline": "frontend",
                "estimate": "S"
            },
            {
                "id": "s7-12",
                "title": "Immutable append-only audit log database table and indexing",
                "desc": "High-volume partition indexing ensuring fast audit retrieval by actor and date.",
                "discipline": "backend",
                "estimate": "M"
            }
        ]
    }
],
    tasks: [
    {
        "id": "s7-1",
        "title": "Build Users list with status tabs & stale user review",
        "desc": "Highlight staff not logged in for 90+ days; provide soft deactivation.",
        "discipline": "frontend",
        "estimate": "M"
    },
    {
        "id": "s7-2",
        "title": "Implement 'Change Role' dialog with permission diff",
        "desc": "Clearly show what capabilities the user gains or loses before saving.",
        "discipline": "frontend",
        "estimate": "M"
    },
    {
        "id": "s7-7",
        "title": "Automated stale user detection and notification job",
        "desc": "Cron flag marking inactive staff accounts for quarterly access recertification.",
        "discipline": "backend",
        "estimate": "S"
    },
    {
        "id": "s7-3",
        "title": "Build Roles & Permissions matrix editor",
        "desc": "Tabular matrix of areas (Customers, Billing, Catalogue) vs CRUD permissions.",
        "discipline": "frontend",
        "estimate": "L"
    },
    {
        "id": "s7-6",
        "title": "Implement centralized Audit Interceptor & RBAC middleware",
        "desc": "Backend middleware enforcing permission tokens and appending audit rows.",
        "discipline": "backend",
        "estimate": "XL"
    },
    {
        "id": "s7-8",
        "title": "RBAC authorization matrix unit test suite",
        "desc": "Verify route access blocks for non-permitted roles across 25 endpoints.",
        "discipline": "qa",
        "estimate": "S"
    },
    {
        "id": "s7-4",
        "title": "Build Merchant API Key generator with one-time view modal",
        "desc": "Display full secret once; list keys masked (••••ABCD) with revoke modal.",
        "discipline": "frontend",
        "estimate": "M"
    },
    {
        "id": "s7-9",
        "title": "API key hashing, encryption at rest, and instant token revocation",
        "desc": "HMAC hashing and database storage of merchant API keys with revocation check.",
        "discipline": "backend",
        "estimate": "M"
    },
    {
        "id": "s7-10",
        "title": "API Key authentication middleware and rate-limiting tests",
        "desc": "Test bearer token validation and 100 req/min rate limits per merchant.",
        "discipline": "qa",
        "estimate": "S"
    },
    {
        "id": "s7-5",
        "title": "Build System Audit Log table with filter & CSV export",
        "desc": "Queryable timeline of system changes with expandable JSON payload diffs.",
        "discipline": "frontend",
        "estimate": "L"
    },
    {
        "id": "s7-11",
        "title": "Expandable JSON payload diff visualizer for audit rows",
        "desc": "Visual comparison of modified database records highlighting changed fields.",
        "discipline": "frontend",
        "estimate": "S"
    },
    {
        "id": "s7-12",
        "title": "Immutable append-only audit log database table and indexing",
        "desc": "High-volume partition indexing ensuring fast audit retrieval by actor and date.",
        "discipline": "backend",
        "estimate": "M"
    }
],
    apiContracts: [
      { endpoint: "/api/v2/users", method: "GET", desc: "Staff directory with assigned role and last login timestamp." },
      { endpoint: "/api/v2/users/{id}/role", method: "PATCH", desc: "Updates user role; logs actor and reason to audit log." },
      { endpoint: "/api/v2/api-keys", method: "POST", desc: "Generates hashed key; returns plain secret once in response." },
      { endpoint: "/api/v2/audit-log", method: "GET", desc: "Queryable audit log with entity filter and date range." }
    ],
    dod: [
      "Staff cannot deactivate their own user account.",
      "API keys cannot be revealed a second time after initial creation modal closes.",
      "All sensitive mutations produce an audit log entry."
    ],
    risks: [
      "Locking out administrators if default Super Admin permissions are accidentally edited.",
      "High volume audit logging impacting database write throughput."
    ],
    prd: {
      version: "1.0.0",
      status: "Planned",
      targetTimeline: "Sprint 7 (Week 8)",
      docFileName: "Sprint_7_Administration_RBAC_Keys_Audit_Logging.md",
      stakeholders: ["CISO", "Compliance Leads", "System Administrators", "Backend & Frontend Engineers"],
      problemStatement: [
        "Severe RBAC Failure: 68 of 70 staff members held full 'ADMIN' access; roles could not be adjusted.",
        "Stale Accounts: 58 users had not signed in for over 90 days, representing an unmonitored security risk.",
        "Unsafe User Deletion: 'Delete User' was a permanent hard-delete button placed right next to 'Suspend'.",
        "Insecure API Key Generation: Keys were issued by typing a raw merchant ID into an unauthenticated text box; keys were shown in plaintext without revocation tools.",
        "Zero Audit Logging: No centralized audit trail existed; the system only recorded basic createdBy strings.",
        "Exposed Database Secrets: The settings screen displayed live database host addresses in plain text."
      ],
      personas: [
        { role: "Security Administrator", desc: "Manages staff access, audits login activity, and configures role-based permission boundaries." },
        { role: "Developer / Integrator", desc: "Generates scoped API keys for merchant integrations and webhooks." },
        { role: "Compliance Auditor", desc: "Reviews historical audit logs and exports tamper-proof CSV action trails." }
      ],
      functionalEpics: [
        {
          epicTitle: "User Management & Stale Account Review (/crm/settings/users)",
          description: "Active, Stale 90+ days, Invited, Deactivated tabs with soft deactivation.",
          requirements: [
            "Invite User CTA replaces direct creation form, sending time-limited invitation tokens.",
            "Change Role permission diff modal highlighting capabilities gained (green) and lost (red).",
            "Soft deactivation with mandatory reason capture. Self-deactivation strictly blocked."
          ]
        },
        {
          epicTitle: "Roles & Permissions Matrix (/crm/settings/roles)",
          description: "Granular access configuration across operational modules.",
          requirements: [
            "System roles: Super Admin (locked), Billing Operations, Sales Representative, Support Agent, Read-Only Viewer.",
            "Area matrix (Customers, Billing, Catalogue, Growth, Settings) with discrete permissions: View, Create, Edit, Suspend/Publish, Export."
          ]
        },
        {
          epicTitle: "Merchant API Key Lifecycle (/crm/settings/api-keys)",
          description: "Generate key shown once with copy CTA, store masked, revoke with reason.",
          requirements: [
            "Generate modal requires selecting merchant, entering key label, and picking scope.",
            "Plaintext secret shown once with copy button; hashed via SHA-256 at rest.",
            "Key directory lists masked keys (••••ABCD) with revocation confirmation modal."
          ]
        },
        {
          epicTitle: "System Audit Log (/crm/settings/audit)",
          description: "Immutable append-only ledger of all mutations with CSV export.",
          requirements: [
            "Records timestamp, actor (name + email + IP), action, target entity, and expandable before/after JSON diff.",
            "Filterable by date range, action type, and staff member with CSV compliance export."
          ]
        }
      ],
      techArchitecture: [
        "src/lib/mock/settings.ts: Users, Roles, API Keys, and Audit Log data models",
        "src/app/crm/settings/users/page.tsx: User directory and role change modal",
        "src/app/crm/settings/roles/page.tsx: Roles & permissions matrix editor",
        "src/app/crm/settings/api-keys/page.tsx: Merchant API key manager",
        "src/app/crm/settings/audit/page.tsx: System audit log with CSV export"
      ],
      nfrs: [
        "Zero Raw Secrets: API keys and credentials must be salted and hashed at rest using industry-standard hashing algorithms (bcrypt / SHA-256).",
        "Audit Immutability: The audit log table must be append-only at the database engine level (no UPDATE or DELETE privileges granted to application connection pool).",
        "Session Expiry: Staff sessions must automatically invalidate after 15 minutes of inactivity for sensitive administration routes."
      ],
      dodList: [
        "Staff cannot deactivate their own user account.",
        "API keys cannot be revealed a second time after initial creation modal closes.",
        "All sensitive mutations produce an audit log entry.",
        "Changing a user's role renders a clear visual comparison of permissions gained and lost before confirmation."
      ]
    }
  },
  {
    id: "sprint-8",
    sprintNum: 8,
    title: "Backend Integration, QA & Production Launch",
    subtitle: "Connect real v2 APIs, run regression test suites, and cut over from legacy CRM",
    badge: "Production Ready",
    duration: "Week 9",
    status: "Planned",
    goal: "Replace in-memory mock stores with real v2 REST endpoints, execute complete Playwright E2E test suites, migrate merchant data, and decommission legacy Angular screens.",
    businessValue: "Goes live with modern, fast, and reliable CRM software that delights staff and eliminates legacy system downtime.",
    leadIcon: Database,
    deliverables: [
    {
        "id": "s8-d1",
        "title": "Production REST Client Layer",
        "description": "Replaces lib/mock/*.ts with typed Axios/fetch clients, token refresh, and caching.",
        "tags": [
            "API Client",
            "Integration"
        ],
        "story": {
            "id": "US-8.1",
            "title": "Typed Production REST API Client Integration",
            "asA": "Lead Fullstack Architect",
            "iWant": "a typed production REST API client layer replacing mock memory stores with real v2 backend calls",
            "soThat": "the Next.js application executes authenticated live operations against CICOD's cloud APIs",
            "acceptanceCriteria": [
                "Replaces mock stores with typed Axios/fetch clients with automatic JWT refresh.",
                "Global React Query caching and invalidation strategies for responsive UI.",
                "Global Error Boundary and toast telemetry for 4xx/5xx network errors."
            ]
        },
        "tasks": [
            {
                "id": "s8-1",
                "title": "Implement typed API client layer (lib/api/*.ts)",
                "desc": "Replace in-memory stores with React Query / server actions handling 401s.",
                "discipline": "frontend",
                "estimate": "XL"
            },
            {
                "id": "s8-2",
                "title": "Add global Error Boundaries & toast failure telemetry",
                "desc": "Ensure graceful degradation and contextual error alerts across all routes.",
                "discipline": "frontend",
                "estimate": "M"
            },
            {
                "id": "s8-7",
                "title": "Token refresh rotation interceptor with automatic login redirect",
                "desc": "Handle expired JWT access tokens seamlessly via refresh cookie exchange.",
                "discipline": "frontend",
                "estimate": "M"
            }
        ]
    },
    {
        "id": "s8-d2",
        "title": "Automated End-to-End Test Suite",
        "description": "Comprehensive Playwright test suites covering all 5 primary customer and billing journeys.",
        "tags": [
            "Playwright",
            "E2E Testing"
        ],
        "story": {
            "id": "US-8.2",
            "title": "Comprehensive Playwright E2E Regression Testing",
            "asA": "QA Automation Engineer",
            "iWant": "a comprehensive Playwright end-to-end regression test suite covering all critical customer and billing flows",
            "soThat": "we guarantee zero broken workflows across deployments and releases",
            "acceptanceCriteria": [
                "Covers 5 core journeys: Customer Search, Plan Creation, Offline Payment, Lead Conversion, Key Gen.",
                "Executes in headless CI pipeline on every pull request.",
                "Zero flaky tests with automated retry and video artifact capture."
            ]
        },
        "tasks": [
            {
                "id": "s8-3",
                "title": "Automate Playwright E2E regression tests in CI",
                "desc": "Execute full suite: customer search, plan creation, offline payment, key generation.",
                "discipline": "qa",
                "estimate": "XL"
            },
            {
                "id": "s8-5",
                "title": "Staging User Acceptance Testing (UAT) with Ops team",
                "desc": "Structured walkthrough with Adeola and customer operations staff.",
                "discipline": "qa",
                "estimate": "L"
            },
            {
                "id": "s8-8",
                "title": "Cross-browser regression testing on Chrome, Firefox, Safari, Edge",
                "desc": "Verify pixel consistency and zero script errors across top browser engines.",
                "discipline": "qa",
                "estimate": "M"
            }
        ]
    },
    {
        "id": "s8-d3",
        "title": "Data Migration & Go-Live Cutover",
        "description": "Sanitized data migration of 13,355 merchants, dunning configurations, and user accounts.",
        "tags": [
            "Migration",
            "Cutover"
        ],
        "story": {
            "id": "US-8.3",
            "title": "Sanitized Merchant Data Migration & Zero-Downtime DNS Cutover",
            "asA": "DevOps & Infrastructure Lead",
            "iWant": "sanitized data migration scripts and a zero-downtime DNS cutover plan from legacy Angular to Next.js",
            "soThat": "all 13,355 merchants and active billing subscriptions transfer seamlessly to the new CRM",
            "acceptanceCriteria": [
                "Migrates and sanitizes 13,355 merchants, plans, users, and dunning policies.",
                "Dry-run validation checks data integrity and foreign key constraints.",
                "DNS cutover with rollback strategy executed during scheduled low-traffic window."
            ]
        },
        "tasks": [
            {
                "id": "s8-4",
                "title": "Execute legacy data cleanup & migration scripts",
                "desc": "Normalize phone numbers to +234, reconcile failed payments, deduplicate plans.",
                "discipline": "backend",
                "estimate": "XL"
            },
            {
                "id": "s8-6",
                "title": "DNS switchover & legacy CRM deprecation",
                "desc": "Route internal.cicod.com/crm to the new Next.js production build.",
                "discipline": "backend",
                "estimate": "M"
            },
            {
                "id": "s8-9",
                "title": "Production telemetry, APM monitoring, and health check alerts",
                "desc": "Real-time error tracking with Datadog/Sentry and latency alerting thresholds.",
                "discipline": "backend",
                "estimate": "M"
            }
        ]
    }
],
    tasks: [
    {
        "id": "s8-1",
        "title": "Implement typed API client layer (lib/api/*.ts)",
        "desc": "Replace in-memory stores with React Query / server actions handling 401s.",
        "discipline": "frontend",
        "estimate": "XL"
    },
    {
        "id": "s8-2",
        "title": "Add global Error Boundaries & toast failure telemetry",
        "desc": "Ensure graceful degradation and contextual error alerts across all routes.",
        "discipline": "frontend",
        "estimate": "M"
    },
    {
        "id": "s8-7",
        "title": "Token refresh rotation interceptor with automatic login redirect",
        "desc": "Handle expired JWT access tokens seamlessly via refresh cookie exchange.",
        "discipline": "frontend",
        "estimate": "M"
    },
    {
        "id": "s8-3",
        "title": "Automate Playwright E2E regression tests in CI",
        "desc": "Execute full suite: customer search, plan creation, offline payment, key generation.",
        "discipline": "qa",
        "estimate": "XL"
    },
    {
        "id": "s8-5",
        "title": "Staging User Acceptance Testing (UAT) with Ops team",
        "desc": "Structured walkthrough with Adeola and customer operations staff.",
        "discipline": "qa",
        "estimate": "L"
    },
    {
        "id": "s8-8",
        "title": "Cross-browser regression testing on Chrome, Firefox, Safari, Edge",
        "desc": "Verify pixel consistency and zero script errors across top browser engines.",
        "discipline": "qa",
        "estimate": "M"
    },
    {
        "id": "s8-4",
        "title": "Execute legacy data cleanup & migration scripts",
        "desc": "Normalize phone numbers to +234, reconcile failed payments, deduplicate plans.",
        "discipline": "backend",
        "estimate": "XL"
    },
    {
        "id": "s8-6",
        "title": "DNS switchover & legacy CRM deprecation",
        "desc": "Route internal.cicod.com/crm to the new Next.js production build.",
        "discipline": "backend",
        "estimate": "M"
    },
    {
        "id": "s8-9",
        "title": "Production telemetry, APM monitoring, and health check alerts",
        "desc": "Real-time error tracking with Datadog/Sentry and latency alerting thresholds.",
        "discipline": "backend",
        "estimate": "M"
    }
],
    apiContracts: [
      { endpoint: "/api/v2/health", method: "GET", desc: "Production health check for database, cache, and message broker." },
      { endpoint: "/api/v2/auth/session", method: "GET", desc: "Validates active JWT token and returns staff permissions map." }
    ],
    dod: [
      "100% of Playwright end-to-end tests pass cleanly on CI/CD pipeline.",
      "Customer omni-search responds within < 200ms on 13,355 merchant database.",
      "Zero unhandled runtime exceptions or console errors across all 25 pages."
    ],
    risks: [
      "Unexpected legacy data anomalies during live migration.",
      "Network latency between front-end hosting and legacy database cluster."
    ],
    prd: {
      version: "1.0.0",
      status: "Planned",
      targetTimeline: "Sprint 8 (Week 9)",
      docFileName: "Sprint_8_Backend_Integration_QA_Production_Launch.md",
      stakeholders: ["VP of Engineering", "Lead DevOps / SRE", "Head of QA", "All Product & Operations Leads"],
      problemStatement: [
        "Leaky Backend API Contract: Legacy Java/Hibernate endpoints leaked ORM internals (hibernateLazyInitializer) and used inconsistent keys.",
        "Mock Data Limitations: Next.js prototype currently runs on mock in-memory state stores that reset on browser reload.",
        "Lack of Automated E2E Testing: Legacy changes were deployed without end-to-end regression suites, resulting in broken search and pagination."
      ],
      personas: [
        { role: "DevOps / Cloud Architect", desc: "Manages CI/CD pipelines, containerized deployments, SSL certificates, and zero-downtime DNS cutover." },
        { role: "QA Automation Engineer", desc: "Writes and maintains automated Playwright test scripts, testing edge cases across browsers." },
        { role: "Operations Lead (Adeola Adesina)", desc: "Validates live production data against daily workflows during staging User Acceptance Testing." }
      ],
      functionalEpics: [
        {
          epicTitle: "Production REST Client Layer (src/lib/api/)",
          description: "Typed API fetchers with automatic JWT refresh and error boundaries.",
          requirements: [
            "Typed API client layer using React Query or Server Actions with full TypeScript DTO mapping.",
            "Axios/Fetch interceptors automatically injecting Authorization Bearer token.",
            "Transparent 401 token refresh catching expired tokens and retrying request without user interruption.",
            "React Error Boundaries around major page modules with contextual error toasts."
          ]
        },
        {
          epicTitle: "Data Migration & Sanitization",
          description: "Migrate 13,355 merchants, sanitize phone numbers, and deduplicate plans.",
          requirements: [
            "Migrate 13,355 merchant records, normalizing phone numbers to E.164 (+234...).",
            "Deduplicate legacy offers ('Premium.', 'Premium 1') into unified plans with version tags.",
            "Seed official 36 Nigerian states + 774 LGAs, curated countries, and active currencies."
          ]
        },
        {
          epicTitle: "Automated Playwright E2E Regression Suite",
          description: "End-to-end browser automation covering all 5 core journeys.",
          requirements: [
            "Customer Operations: Search by CICOD #, verify health, open 360, add note.",
            "Catalogue & Pricing: Create plan, assign features, fill pricing matrix with 10x shortcut, publish.",
            "Billing & Collections: Filter failed payments, record offline payment, verify removal from Collections queue.",
            "Sales Pipeline: Drag lead between stages, convert to customer, complete wizard.",
            "Security Governance: Generate API key, verify secret shown once, test revocation dialog."
          ]
        },
        {
          epicTitle: "UAT & Production Cutover",
          description: "Staging sign-off, zero-downtime blue/green DNS switchover, and legacy decommission.",
          requirements: [
            "Structured walkthrough on staging-crm.cicod.com with zero P1/P2 defects.",
            "Blue/Green production deployment routing internal.cicod.com/crm to Next.js cluster.",
            "Deprecate legacy Angular Metronic application."
          ]
        }
      ],
      techArchitecture: [
        "src/lib/api/: Typed production REST API client modules",
        "tests/e2e/: Automated Playwright test suites covering 5 core journeys",
        "docker/Dockerfile: Multi-stage production container build",
        ".github/workflows/deploy.yml: Automated CI/CD deployment pipeline"
      ],
      nfrs: [
        "API Performance: 95th percentile (p95) response time under 200ms on all list queries.",
        "Availability & Uptime: 99.9% uptime SLA for production CRM web application and backing APIs.",
        "Disaster Recovery (RPO/RTO): Recovery Point Objective < 1 hour; Recovery Time Objective < 15 minutes."
      ],
      dodList: [
        "100% of Playwright end-to-end regression test scripts pass cleanly in the automated CI pipeline.",
        "Zero runtime TypeScript, ESLint, or unhandled promise rejection warnings in browser console.",
        "Staging UAT sign-off completed and signed off by Customer Operations, Finance, and Product leads.",
        "Successful production DNS switchover with zero disruption to active customer billing or tenant provisioning."
      ]
    }
  }
];

const ROADMAP_TASKS_STORAGE_KEY = "cicod_crm_roadmap_completed_tasks_v1";

const DEFAULT_COMPLETED_TASKS: Record<string, boolean> = {
  "s0-1": true, "s0-2": true, "s0-3": true, "s0-4": true, "s0-5": true,
  "s0-6": true, "s0-7": true, "s0-8": true, "s0-9": true,
  "s1-1": true, "s1-2": true, "s1-3": true, "s1-4": true,
  "s1-6": true, "s1-7": true, "s1-8": true
};

export default function RoadmapPage() {
  const [selectedPhaseId, setSelectedPhaseId] = React.useState<string>("sprint-0");
  const [filterDiscipline, setFilterDiscipline] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [completedTasks, setCompletedTasks] = React.useState<Record<string, boolean>>(DEFAULT_COMPLETED_TASKS);
  const [isHydrated, setIsHydrated] = React.useState<boolean>(false);
  const [activeTab, setActiveTab] = React.useState<"overview" | "tasks" | "apis" | "dod" | "testcases" | "prd">("overview");
  const [taskViewMode, setTaskViewMode] = React.useState<"grouped" | "flat">("grouped");

  // Side modules rail toggle - default state is closed (false) per user request
  const [isModulesSidebarOpen, setIsModulesSidebarOpen] = React.useState<boolean>(false);

  // Load user preference for side modules sidebar if previously toggled
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("cicod_crm_modules_sidebar_open");
      if (saved !== null) {
        setIsModulesSidebarOpen(saved === "true");
      }
    } catch {}
  }, []);

  const toggleModulesSidebar = () => {
    setIsModulesSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("cicod_crm_modules_sidebar_open", String(next));
      } catch {}
      return next;
    });
  };

  // Load persisted tasks from localStorage on client mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(ROADMAP_TASKS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          setCompletedTasks(parsed);
        }
      }
    } catch (e) {
      console.warn("Could not load tasks from localStorage:", e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Persist completedTasks to localStorage on changes
  React.useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(ROADMAP_TASKS_STORAGE_KEY, JSON.stringify(completedTasks));
    } catch (e) {
      console.warn("Could not save tasks to localStorage:", e);
    }
  }, [completedTasks, isHydrated]);

  const selectedPhase = PHASES.find((p) => p.id === selectedPhaseId) ?? PHASES[0];

  const switchTab = (tabId: "overview" | "tasks" | "apis" | "dod" | "testcases" | "prd") => {
    setActiveTab(tabId);
    try {
      const url = new URL(window.location.href);
      url.hash = tabId;
      window.history.replaceState(null, "", url.toString());
    } catch {}
  };

  // Listen to URL hash & query params on mount and on hashchange for deep routing
  React.useEffect(() => {
    const handleUrlRoute = () => {
      const hash = window.location.hash.replace("#", "");
      const params = new URLSearchParams(window.location.search);
      const target = params.get("tab") || hash;

      if (target === "testcases" || target === "test-cases" || target === "tests" || target === "qa" || target.startsWith("prd-section-16")) {
        setActiveTab("testcases");
      } else if (target === "prd" || target.startsWith("prd-section-")) {
        setActiveTab("prd");
      } else if (target === "tasks") {
        setActiveTab("tasks");
      } else if (target === "apis" || target === "api") {
        setActiveTab("apis");
      } else if (target === "dod") {
        setActiveTab("dod");
      } else if (target === "overview" || target === "deliverables") {
        setActiveTab("overview");
      }

      const sprintParam = params.get("sprint");
      if (sprintParam) {
        const found = PHASES.find(p => p.sprintNum === parseInt(sprintParam, 10) || p.id === sprintParam);
        if (found) setSelectedPhaseId(found.id);
      }
    };

    handleUrlRoute();
    window.addEventListener("hashchange", handleUrlRoute);
    return () => window.removeEventListener("hashchange", handleUrlRoute);
  }, []);

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      toast.success(next[taskId] ? "Task completed (saved to localStorage)" : "Task reopened (saved to localStorage)");
      return next;
    });
  };

  const resetAllTasks = () => {
    setCompletedTasks(DEFAULT_COMPLETED_TASKS);
    try {
      localStorage.setItem(ROADMAP_TASKS_STORAGE_KEY, JSON.stringify(DEFAULT_COMPLETED_TASKS));
    } catch {}
    toast.success("Tasks reset to default state");
  };

  // Compute metrics
  const totalTasks = PHASES.reduce((acc, p) => acc + p.tasks.length, 0);
  const doneCount = Object.values(completedTasks).filter(Boolean).length;
  const progressPercent = Math.round((doneCount / totalTasks) * 100);

  // Filter tasks in current phase
  const filteredTasks = selectedPhase.tasks.filter((t) => {
    const matchDisc = filterDiscipline === "all" || t.discipline === filterDiscipline;
    const matchSearch = searchQuery === "" ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDisc && matchSearch;
  });

  const copyPRDToClipboard = async () => {
    try {
      const res = await fetch(`/prds/${selectedPhase.prd.docFileName}`);
      if (res.ok) {
        const text = await res.text();
        await navigator.clipboard.writeText(text);
        toast.success(`Copied Sprint ${selectedPhase.sprintNum} PRD to clipboard!`);
        return;
      }
    } catch {
      // fallback if fetch fails
    }
    const p = selectedPhase.prd;
    const fallbackText = `# PRD: Sprint ${selectedPhase.sprintNum} - ${selectedPhase.title}\nVersion: ${p.version} | Status: ${p.status}\n\nTarget Timeline: ${p.targetTimeline}\nFile: ${p.docFileName}`;
    await navigator.clipboard.writeText(fallbackText);
    toast.success(`Copied Sprint ${selectedPhase.sprintNum} PRD to clipboard!`);
  };

  return (
    <div className="max-w-[1600px] w-full mx-auto flex flex-col gap-8 pb-16">
      {/* Top Banner & Header */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--accent)]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[0.72rem] font-bold uppercase tracking-wider bg-[var(--accent)] text-[var(--accent-foreground)]">
              Engineering Master Plan
            </span>
            <span className="text-[0.8rem] text-[var(--muted-foreground)]">· 9 Phased Sprints with PRDs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight m-0 text-[var(--foreground)] flex items-center gap-3">
            <CalendarRange className="w-8 h-8 text-[var(--primary)]" />
            CICOD CRM Implementation Roadmap & PRDs
          </h1>
          <p className="text-[0.9rem] text-[var(--muted-foreground)] mt-2 max-w-3xl leading-relaxed">
            Step-by-step sprint breakdown and full integrated Product Requirements Documents (PRDs). Includes functional epics, API contracts, user personas, and acceptance criteria.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 relative z-10">
          <button
            type="button"
            onClick={toggleModulesSidebar}
            className={cn(
              "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[0.85rem] font-semibold border transition-all shadow-sm",
              isModulesSidebarOpen
                ? "border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)]/20 text-[var(--foreground)]"
                : "border-[var(--primary)]/40 bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-95"
            )}
            title={isModulesSidebarOpen ? "Close side modules rail" : "Open side modules rail"}
          >
            {isModulesSidebarOpen ? (
              <>
                <PanelLeftClose className="w-4 h-4" />
                <span>Close Side Modules</span>
              </>
            ) : (
              <>
                <PanelLeftOpen className="w-4 h-4" />
                <span>Open Side Modules</span>
              </>
            )}
          </button>
          <a
            href="/crm-module-map.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[0.85rem] font-semibold border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)]/20 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-[var(--primary)]" /> Legacy Module Map
          </a>
          <a
            href="/crm-sprints-roadmap.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[0.85rem] font-semibold bg-[var(--secondary)] text-[var(--secondary-foreground)] shadow-sm hover:opacity-95 transition-opacity"
          >
            <Download className="w-4 h-4" /> Full HTML Dossier
          </a>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm flex flex-col gap-1">
          <span className="text-[0.75rem] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Total Sprints</span>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-[var(--foreground)]">9 Phases</div>
          <span className="text-[0.78rem] text-[var(--muted-foreground)]">9 Individual PRD Documents</span>
        </div>

        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm flex flex-col gap-1">
          <span className="text-[0.75rem] font-bold uppercase tracking-wider text-[var(--primary)]">Sprint Execution</span>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-[var(--primary)]">{progressPercent}%</div>
          <div className="w-full bg-[var(--input)] rounded-full h-1.5 mt-1 overflow-hidden">
            <div className="bg-[var(--primary)] h-1.5 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm flex flex-col gap-1">
          <span className="text-[0.75rem] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Tasks Completed</span>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-[var(--success)]">{doneCount} / {totalTasks}</div>
          <span className="text-[0.78rem] text-[var(--muted-foreground)]">Sprint 0 & 1 Underway</span>
        </div>

        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm flex flex-col gap-1">
          <span className="text-[0.75rem] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">PRD Artifacts</span>
          <div className="text-xl sm:text-2xl font-heading font-extrabold text-[var(--foreground)]">100% Written</div>
          <span className="text-[0.78rem] text-[var(--muted-foreground)]">Integrated into UI & disk</span>
        </div>
      </div>

      {/* Main Roadmap Explorer Grid */}
      <div className={cn(
        "grid gap-6 items-start transition-all duration-300",
        isModulesSidebarOpen ? "grid-cols-1 lg:grid-cols-[360px_1fr]" : "grid-cols-1"
      )}>
        {/* Left Side: Sprint Track Selector (Collapsible) */}
        {isModulesSidebarOpen && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--primary)]" />
                <h2 className="text-[0.95rem] font-heading font-bold text-[var(--foreground)] m-0">Sprint Modules</h2>
              </div>
              <button
                type="button"
                onClick={toggleModulesSidebar}
                title="Close side modules rail"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.75rem] font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]/30 border border-[var(--border)] transition-colors shadow-sm"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
                <span>Close</span>
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {PHASES.map((phase) => {
                const isSelected = phase.id === selectedPhaseId;
                const IconComp = phase.leadIcon;
                const phaseDoneTasks = phase.tasks.filter((t) => completedTasks[t.id]).length;
                const phaseTotalTasks = phase.tasks.length;
                const isComplete = phaseDoneTasks === phaseTotalTasks;

                return (
                  <button
                    key={phase.id}
                    type="button"
                    onClick={() => setSelectedPhaseId(phase.id)}
                    className={cn(
                      "text-left p-4 rounded-xl border-[1.5px] transition-all flex flex-col gap-2 relative overflow-hidden group",
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--card)] shadow-md ring-1 ring-[var(--primary)]/30"
                        : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/50"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center font-heading font-extrabold text-[0.8rem]",
                          isSelected ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-[var(--accent)] text-[var(--accent-foreground)]"
                        )}>
                          {phase.sprintNum}
                        </span>
                        <span className="font-heading font-bold text-[0.95rem] text-[var(--foreground)]">
                          Sprint {phase.sprintNum}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[0.72rem] font-semibold text-[var(--muted-foreground)]">
                          {phase.duration}
                        </span>
                        {phase.status === "Completed" && (
                          <span className="w-2 h-2 rounded-full bg-[var(--success)]" title="Completed" />
                        )}
                        {phase.status === "In Progress" && (
                          <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" title="In Progress" />
                        )}
                      </div>
                    </div>

                    <div className="text-[0.85rem] font-semibold text-[var(--foreground)] leading-snug">
                      {phase.title}
                    </div>

                    <div className="flex items-center justify-between text-[0.75rem] text-[var(--muted-foreground)] mt-1 pt-2 border-t border-[var(--border)]">
                      <span className="flex items-center gap-1.5">
                        <IconComp className="w-3.5 h-3.5 text-[var(--primary)]" />
                        {phase.badge}
                      </span>
                      <span className={cn(
                        "font-semibold tabular-nums",
                        isComplete ? "text-[var(--success)]" : ""
                      )}>
                        {phaseDoneTasks}/{phaseTotalTasks} tasks
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPhaseId(phase.id);
                          switchTab("testcases");
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.68rem] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white transition-colors cursor-pointer"
                        title="Jump directly to QA & PM Test Scenarios"
                      >
                        <FlaskConical className="w-3 h-3 text-purple-500" />
                        <span>{(SPRINT_TEST_CASES[phase.sprintNum] || []).length} Tests</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPhaseId(phase.id);
                          switchTab("prd");
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.68rem] font-bold bg-[var(--background)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--primary)] transition-colors cursor-pointer"
                        title="View Sprint PRD"
                      >
                        <FileText className="w-3 h-3" />
                        <span>PRD</span>
                      </button>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Right Side: Deep Dive Detail Panel */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden flex flex-col min-w-0">
          {/* Phase Header */}
          <div className="p-6 sm:p-8 border-b border-[var(--border)] bg-[var(--background)]/50 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Toggle Sidebar Button */}
                <button
                  type="button"
                  onClick={toggleModulesSidebar}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[0.8rem] font-semibold transition-all shadow-sm",
                    isModulesSidebarOpen
                      ? "bg-[var(--card)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--primary)]"
                      : "bg-[var(--secondary)] text-[var(--secondary-foreground)] border-transparent hover:opacity-90"
                  )}
                  title={isModulesSidebarOpen ? "Close side modules rail" : "Open side modules rail"}
                >
                  {isModulesSidebarOpen ? (
                    <>
                      <PanelLeftClose className="w-4 h-4" />
                      <span>Close Modules</span>
                    </>
                  ) : (
                    <>
                      <PanelLeftOpen className="w-4 h-4" />
                      <span>Open Modules (9)</span>
                    </>
                  )}
                </button>

                <span className="px-3 py-1 rounded-full text-[0.75rem] font-extrabold uppercase tracking-wide bg-[var(--primary)] text-[var(--primary-foreground)]">
                  Sprint {selectedPhase.sprintNum} · {selectedPhase.duration}
                </span>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[0.72rem] font-bold uppercase",
                  selectedPhase.status === "Completed" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                  selectedPhase.status === "In Progress" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                  "bg-slate-500/10 text-slate-600 dark:text-slate-400"
                )}>
                  {selectedPhase.status}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => switchTab("testcases")}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[0.8rem] font-semibold transition-colors shadow-sm",
                    activeTab === "testcases"
                      ? "bg-purple-600 text-white border-transparent"
                      : "bg-[var(--card)] border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
                  )}
                >
                  <FlaskConical className="w-3.5 h-3.5" /> 🧪 Use Cases & Tests ({(SPRINT_TEST_CASES[selectedPhase.sprintNum] || []).length})
                </button>
                <button
                  type="button"
                  onClick={() => switchTab("prd")}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[0.8rem] font-semibold transition-colors shadow-sm",
                    activeTab === "prd"
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent"
                      : "bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)]"
                  )}
                >
                  <FileText className="w-3.5 h-3.5" /> View Full PRD
                </button>
                <button
                  type="button"
                  onClick={copyPRDToClipboard}
                  title="Copy PRD to clipboard"
                  className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--accent)]/20 text-[var(--foreground)] transition-colors"
                >
                  <Copy className="w-4 h-4 text-[var(--muted-foreground)]" />
                </button>
              </div>
            </div>

            {/* Quick Sprint Selector Bar */}
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]/60 overflow-x-auto custom-scrollbar">
              <span className="text-[0.72rem] font-bold uppercase tracking-wider text-[var(--muted-foreground)] shrink-0">
                Quick Jump:
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {PHASES.map((phase) => {
                  const isSelected = phase.id === selectedPhaseId;
                  const phaseDoneTasks = phase.tasks.filter((t) => completedTasks[t.id]).length;
                  const phaseTotalTasks = phase.tasks.length;
                  const isComplete = phaseDoneTasks === phaseTotalTasks;

                  return (
                    <button
                      key={phase.id}
                      type="button"
                      onClick={() => setSelectedPhaseId(phase.id)}
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.75rem] font-heading font-bold transition-all whitespace-nowrap",
                        isSelected
                          ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                          : "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)] hover:bg-[var(--accent)]/20"
                      )}
                      title={`Sprint ${phase.sprintNum}: ${phase.title}`}
                    >
                      <span>S{phase.sprintNum}</span>
                      <span className="text-[0.68rem] font-normal opacity-80 hidden md:inline">· {phase.badge}</span>
                      {isComplete ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] ml-0.5" />
                      ) : phase.status === "In Progress" ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse ml-0.5" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-[var(--foreground)] m-0">
                {selectedPhase.title}
              </h2>
              <p className="text-[0.9rem] text-[var(--muted-foreground)] mt-1 m-0">
                {selectedPhase.subtitle}
              </p>
            </div>

            {/* Goal & Business Value */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] flex flex-col gap-1">
                <span className="text-[0.72rem] font-bold uppercase tracking-wider text-[var(--primary)] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Sprint Objective
                </span>
                <p className="text-[0.84rem] text-[var(--foreground)] m-0 leading-relaxed">
                  {selectedPhase.goal}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] flex flex-col gap-1">
                <span className="text-[0.72rem] font-bold uppercase tracking-wider text-[var(--success)] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Commercial Impact
                </span>
                <p className="text-[0.84rem] text-[var(--foreground)] m-0 leading-relaxed">
                  {selectedPhase.businessValue}
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)] overflow-x-auto">
              {[
                { id: "overview", label: `Deliverables & Stories (${selectedPhase.deliverables.length})` },
                { id: "tasks", label: `Tasks & Checklist (${selectedPhase.tasks.length})` },
                { id: "testcases", label: `🧪 Use Cases & Test Scenarios (${(SPRINT_TEST_CASES[selectedPhase.sprintNum] || []).length})` },
                { id: "apis", label: `API Contracts (${selectedPhase.apiContracts.length})` },
                { id: "dod", label: "Definition of Done & Risks" },
                { id: "prd", label: "📄 Full 16-Section PRD Specification" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => switchTab(tab.id as any)}
                  className={cn(
                    "px-4 py-2 rounded-lg font-heading text-[0.85rem] font-bold transition-colors whitespace-nowrap flex items-center gap-1.5",
                    activeTab === tab.id
                      ? "bg-[var(--secondary)] text-[var(--secondary-foreground)] shadow-sm"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]/10"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Phase Tab Content */}
          <div className="p-6 sm:p-8 flex flex-col gap-6">
            {/* TAB 1: Key Deliverables & Stories */}
            {activeTab === "overview" && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
                  <div>
                    <h3 className="text-lg font-heading font-extrabold text-[var(--foreground)] m-0 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[var(--primary)]" />
                      Sprint {selectedPhase.sprintNum} Deliverables & User Stories
                    </h3>
                    <p className="text-[0.85rem] text-[var(--muted-foreground)] mt-1 m-0">
                      Every deliverable includes a dedicated Agile User Story, testable acceptance criteria, and outlined engineering tasks.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[0.75rem] font-bold bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 shrink-0">
                    {selectedPhase.deliverables.length} Deliverables · {selectedPhase.tasks.length} Outlined Tasks
                  </span>
                </div>

                <div className="flex flex-col gap-6">
                  {selectedPhase.deliverables.map((item) => {
                    const delivDone = item.tasks.filter((t) => completedTasks[t.id]).length;
                    const delivTotal = item.tasks.length;
                    const delivProgress = delivTotal > 0 ? Math.round((delivDone / delivTotal) * 100) : 0;

                    return (
                      <div key={item.id} className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--background)] flex flex-col gap-5 shadow-sm hover:border-[var(--primary)]/40 transition-all">
                        {/* Top: Deliverable Header & Tags */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[var(--border)] pb-4">
                          <div className="flex flex-col gap-1.5 flex-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-md text-[0.72rem] font-mono font-extrabold bg-[var(--primary)] text-[var(--primary-foreground)]">
                                {item.story.id}
                              </span>
                              <h4 className="font-heading font-extrabold text-[1.1rem] text-[var(--foreground)] m-0">
                                {item.title}
                              </h4>
                            </div>
                            <p className="text-[0.86rem] text-[var(--muted-foreground)] m-0 leading-relaxed">
                              {item.description}
                            </p>
                          </div>

                          <div className="flex sm:flex-col sm:items-end justify-between items-center gap-2 shrink-0">
                            <div className="flex flex-wrap gap-1">
                              {item.tags.map((tag) => (
                                <span key={tag} className="px-2 py-0.5 rounded-md text-[0.68rem] font-semibold bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)]">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <span className="text-[0.76rem] font-bold text-[var(--primary)]">
                              {delivDone} of {delivTotal} tasks completed ({delivProgress}%)
                            </span>
                          </div>
                        </div>

                        {/* Agile User Story Box */}
                        <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[0.72rem] font-bold uppercase tracking-wider text-[var(--primary)] flex items-center gap-1.5 font-heading">
                              <Target className="w-3.5 h-3.5 text-[var(--primary)]" />
                              Agile User Story · {item.story.title}
                            </span>
                            <span className="text-[0.7rem] text-[var(--muted-foreground)]">
                              Deliverable Story Anchor
                            </span>
                          </div>

                          <div className="text-[0.88rem] leading-relaxed text-[var(--foreground)] bg-[var(--background)]/70 p-3.5 rounded-lg border border-[var(--border)]/60">
                            <span className="font-extrabold text-[var(--primary)]">As a </span>
                            <span className="font-bold underline decoration-[var(--primary)]/40 underline-offset-2">{item.story.asA}</span>
                            <span className="font-extrabold text-[var(--primary)]">, I want </span>
                            <span className="font-medium">{item.story.iWant}</span>
                            <span className="font-extrabold text-[var(--primary)]">, so that </span>
                            <span className="font-medium">{item.story.soThat}</span>.
                          </div>

                          {/* Acceptance Criteria */}
                          <div className="mt-1">
                            <span className="text-[0.72rem] font-bold uppercase tracking-wider text-[var(--muted-foreground)] block mb-1.5">
                              Acceptance Criteria:
                            </span>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 m-0 p-0 list-none text-[0.8rem]">
                              {item.story.acceptanceCriteria.map((crit, cIdx) => (
                                <li key={cIdx} className="flex items-start gap-2 text-[var(--foreground)] bg-[var(--background)]/40 p-2.5 rounded-lg border border-[var(--border)]/40">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                  <span className="leading-snug">{crit}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Outlined Tasks for this Deliverable */}
                        <div className="flex flex-col gap-3 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[0.8rem] font-heading font-extrabold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                              <CheckSquare className="w-4 h-4 text-[var(--primary)]" />
                              Outlined Implementation Tasks ({delivDone}/{delivTotal})
                            </span>
                            <div className="w-32 bg-[var(--input)] rounded-full h-1.5 overflow-hidden">
                              <div className="bg-[var(--primary)] h-1.5 rounded-full transition-all duration-300" style={{ width: `${delivProgress}%` }} />
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            {item.tasks.map((task) => {
                              const isDone = !!completedTasks[task.id];
                              return (
                                <div
                                  key={task.id}
                                  onClick={() => toggleTask(task.id)}
                                  className={cn(
                                    "p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer",
                                    isDone
                                      ? "bg-emerald-500/5 border-emerald-500/20"
                                      : "bg-[var(--card)] border-[var(--border)] hover:border-[var(--primary)]/40"
                                  )}
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleTask(task.id);
                                    }}
                                    className="mt-0.5 text-[var(--primary)] shrink-0 focus:outline-none"
                                    aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                                  >
                                    {isDone ? (
                                      <CheckSquare className="w-4 h-4 text-[var(--success)]" />
                                    ) : (
                                      <Square className="w-4 h-4 text-[var(--muted-foreground)]" />
                                    )}
                                  </button>

                                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={cn(
                                        "font-heading font-bold text-[0.88rem]",
                                        isDone ? "line-through text-[var(--muted-foreground)]" : "text-[var(--foreground)]"
                                      )}>
                                        {task.title}
                                      </span>
                                      <span className="px-2 py-0.5 rounded text-[0.66rem] font-bold uppercase tracking-wider bg-[var(--background)] border border-[var(--border)] text-[var(--muted-foreground)]">
                                        {task.discipline}
                                      </span>
                                      <span className="px-1.5 py-0.5 rounded text-[0.66rem] font-bold bg-[var(--accent)] text-[var(--accent-foreground)]">
                                        {task.estimate}
                                      </span>
                                    </div>
                                    <p className="text-[0.8rem] text-[var(--muted-foreground)] m-0 leading-relaxed">
                                      {task.desc}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: Tasks Checklist */}
            {activeTab === "tasks" && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[0.85rem] font-bold text-[var(--foreground)]">Filter by discipline:</span>
                    <div className="flex gap-1" role="tablist">
                      {["all", "frontend", "backend", "design", "qa"].map((disc) => (
                        <button
                          key={disc}
                          onClick={() => setFilterDiscipline(disc)}
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[0.75rem] font-semibold uppercase tracking-wider transition-colors",
                            filterDiscipline === disc
                              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                              : "bg-[var(--background)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                          )}
                        >
                          {disc}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTaskViewMode(taskViewMode === "grouped" ? "flat" : "grouped")}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[0.78rem] font-semibold text-[var(--foreground)] hover:bg-[var(--accent)]/20 transition-colors"
                    >
                      {taskViewMode === "grouped" ? "📋 Flat List" : "🗂 Group by Deliverable"}
                    </button>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--muted-foreground)]" />
                      <input
                        type="search"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[0.82rem] w-48 sm:w-56 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      />
                    </div>
                  </div>
                </div>

                {/* LocalStorage persistence status bar */}
                <div className="flex items-center justify-between px-1 py-0.5 text-[0.76rem]">
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    Checklist state auto-persisted to browser localStorage
                  </span>
                  <button
                    type="button"
                    onClick={resetAllTasks}
                    className="text-[0.74rem] font-semibold text-[var(--muted-foreground)] hover:text-[var(--destructive)] underline underline-offset-2 transition-colors"
                  >
                    Reset checklist to baseline
                  </button>
                </div>

                {/* Tasks Content: Grouped by Deliverable or Flat */}
                {taskViewMode === "grouped" ? (
                  <div className="flex flex-col gap-6">
                    {selectedPhase.deliverables.map((deliv) => {
                      const delivTasks = deliv.tasks.filter((t) => {
                        const matchDisc = filterDiscipline === "all" || t.discipline === filterDiscipline;
                        const matchSearch = searchQuery === "" ||
                          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.desc.toLowerCase().includes(searchQuery.toLowerCase());
                        return matchDisc && matchSearch;
                      });

                      if (delivTasks.length === 0) return null;

                      const doneInDeliv = delivTasks.filter((t) => completedTasks[t.id]).length;

                      return (
                        <div key={deliv.id} className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--background)] flex flex-col gap-3">
                          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[0.7rem] font-mono font-bold bg-[var(--secondary)] text-[var(--secondary-foreground)]">
                                {deliv.story.id}
                              </span>
                              <span className="font-heading font-extrabold text-[0.95rem] text-[var(--foreground)]">
                                {deliv.title}
                              </span>
                            </div>
                            <span className="text-[0.74rem] font-semibold text-[var(--primary)]">
                              {doneInDeliv} of {delivTasks.length} tasks
                            </span>
                          </div>

                          <div className="flex flex-col gap-2">
                            {delivTasks.map((task) => {
                              const isDone = !!completedTasks[task.id];
                              return (
                                <div
                                  key={task.id}
                                  onClick={() => toggleTask(task.id)}
                                  className={cn(
                                    "p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer",
                                    isDone
                                      ? "bg-emerald-500/5 border-emerald-500/20"
                                      : "bg-[var(--card)] border-[var(--border)] hover:border-[var(--primary)]/40"
                                  )}
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleTask(task.id);
                                    }}
                                    className="mt-0.5 text-[var(--primary)] shrink-0 focus:outline-none"
                                    aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                                  >
                                    {isDone ? (
                                      <CheckSquare className="w-4 h-4 text-[var(--success)]" />
                                    ) : (
                                      <Square className="w-4 h-4 text-[var(--muted-foreground)]" />
                                    )}
                                  </button>

                                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={cn(
                                        "font-heading font-bold text-[0.88rem]",
                                        isDone ? "line-through text-[var(--muted-foreground)]" : "text-[var(--foreground)]"
                                      )}>
                                        {task.title}
                                      </span>
                                      <span className="px-2 py-0.5 rounded text-[0.66rem] font-bold uppercase tracking-wider bg-[var(--background)] border border-[var(--border)] text-[var(--muted-foreground)]">
                                        {task.discipline}
                                      </span>
                                      <span className="px-1.5 py-0.5 rounded text-[0.66rem] font-bold bg-[var(--accent)] text-[var(--accent-foreground)]">
                                        {task.estimate}
                                      </span>
                                    </div>
                                    <p className="text-[0.8rem] text-[var(--muted-foreground)] m-0 leading-relaxed">
                                      {task.desc}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {filteredTasks.length === 0 ? (
                      <div className="p-8 text-center text-[0.85rem] text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-xl">
                        No tasks matching this filter.
                      </div>
                    ) : (
                      filteredTasks.map((task) => {
                        const isDone = !!completedTasks[task.id];
                        return (
                          <div
                            key={task.id}
                            onClick={() => toggleTask(task.id)}
                            className={cn(
                              "p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer",
                              isDone
                                ? "bg-emerald-500/5 border-emerald-500/20"
                                : "bg-[var(--card)] border-[var(--border)] hover:border-[var(--primary)]/40"
                            )}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTask(task.id);
                              }}
                              className="mt-0.5 text-[var(--primary)] shrink-0 focus:outline-none"
                              aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                            >
                              {isDone ? (
                                <CheckSquare className="w-5 h-5 text-[var(--success)]" />
                              ) : (
                                <Square className="w-5 h-5 text-[var(--muted-foreground)]" />
                              )}
                            </button>

                            <div className="flex flex-col gap-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn(
                                  "font-heading font-bold text-[0.9rem]",
                                  isDone ? "line-through text-[var(--muted-foreground)]" : "text-[var(--foreground)]"
                                )}>
                                  {task.title}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[0.68rem] font-bold uppercase tracking-wider bg-[var(--background)] border border-[var(--border)] text-[var(--muted-foreground)]">
                                  {task.discipline}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[0.68rem] font-bold bg-[var(--accent)] text-[var(--accent-foreground)]">
                                  {task.estimate}
                                </span>
                              </div>
                              <p className="text-[0.82rem] text-[var(--muted-foreground)] m-0 leading-relaxed">
                                {task.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: API Contracts */}
            {activeTab === "apis" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[0.95rem] font-heading font-bold text-[var(--foreground)] m-0">
                    Required v2 Backend REST Endpoints
                  </h3>
                  <span className="text-[0.78rem] text-[var(--muted-foreground)]">
                    Clean, non-leaking REST specifications
                  </span>
                </div>

                <div className="overflow-hidden rounded-xl border border-[var(--border)]">
                  <table className="w-full text-left text-[0.85rem]">
                    <thead className="bg-[var(--background)] border-b border-[var(--border)] text-[0.72rem] font-heading font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4 w-28">Method</th>
                        <th className="py-3 px-4 w-80 font-mono">Endpoint</th>
                        <th className="py-3 px-4">Functional Contract & Payload Expectation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)] bg-[var(--card)]">
                      {selectedPhase.apiContracts.map((api, idx) => (
                        <tr key={idx} className="hover:bg-[var(--background)]/50 transition-colors">
                          <td className="py-3 px-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[0.72rem] font-bold font-mono",
                              api.method === "GET" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                              api.method === "POST" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                              api.method === "PATCH" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                              "bg-red-500/10 text-red-600 dark:text-red-400"
                            )}>
                              {api.method}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-[0.82rem] text-[var(--foreground)]">
                            {api.endpoint}
                          </td>
                          <td className="py-3 px-4 text-[var(--muted-foreground)]">
                            {api.desc}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: DoD & Risks */}
            {activeTab === "dod" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-3">
                  <h3 className="text-[0.95rem] font-heading font-bold text-[var(--foreground)] m-0 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                    Definition of Done (DoD)
                  </h3>
                  <ul className="flex flex-col gap-2 p-0 m-0 list-none text-[0.85rem]">
                    {selectedPhase.dod.map((crit, idx) => (
                      <li key={idx} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[var(--success)] mt-0.5 shrink-0" />
                        <span className="text-[var(--foreground)]">{crit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-3">
                  <h3 className="text-[0.95rem] font-heading font-bold text-[var(--foreground)] m-0 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />
                    Key Architectural Risks & Mitigations
                  </h3>
                  <ul className="flex flex-col gap-2 p-0 m-0 list-none text-[0.85rem]">
                    {selectedPhase.risks.map((risk, idx) => (
                      <li key={idx} className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-[var(--warning)] mt-0.5 shrink-0" />
                        <span className="text-[var(--foreground)]">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 5: TEST CASES & USE CASE SCENARIOS FOR PMs & QA */}
            {activeTab === "testcases" && (
              <TestCasesViewer
                sprintNum={selectedPhase.sprintNum}
                sprintTitle={selectedPhase.title}
                testCases={SPRINT_TEST_CASES[selectedPhase.sprintNum] || []}
              />
            )}

            {/* TAB 6: INTEGRATED FULL 16-SECTION PRD SPECIFICATION */}
            {activeTab === "prd" && (
              <PRDViewer
                docFileName={selectedPhase.prd.docFileName}
                sprintNum={selectedPhase.sprintNum}
                sprintTitle={selectedPhase.title}
                fallbackSummary={selectedPhase.goal}
                onOpenTestCases={() => setActiveTab("testcases")}
              />
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
