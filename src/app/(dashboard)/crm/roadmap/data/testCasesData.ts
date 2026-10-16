// Master QA & PM Test Case Scenarios for all 9 sprints
export type TestCaseCategory = "Happy Path" | "Edge Case" | "Security / RBAC" | "Performance & Scale" | "UX & A11y";
export type TestCaseSeverity = "Critical" | "High" | "Medium" | "Low";
export type TestCaseStatus = "Pass" | "Fail" | "Pending";

export type TestCaseItem = {
  id: string;
  title: string;
  category: TestCaseCategory;
  userStoryId: string;
  targetPersona: string;
  severity: TestCaseSeverity;
  preconditions: string;
  steps: string[];
  expectedResult: string;
  status?: TestCaseStatus;
};

export const SPRINT_TEST_CASES: Record<number, TestCaseItem[]> = {
  "0": [
    {
      "id": "TC-0.1",
      "title": "Light to Dark Mode Token Synchronization",
      "category": "Happy Path",
      "userStoryId": "US-0.1",
      "targetPersona": "UI/UX & Frontend Architect",
      "severity": "Critical",
      "preconditions": "Clean browser session with default light theme.",
      "steps": [
        "1. Click Theme toggle button in header ribbon.",
        "2. Inspect computed CSS variables for --background, --card, --foreground, --border.",
        "3. Reload browser page to verify theme persistence."
      ],
      "expectedResult": "Theme variables transition smoothly without flash of unstyled content. Contrast ratio between body text and card surfaces remains >= 4.5:1 in both light (#FBFBFD) and dark (#090E17) modes. Mode persists after page reload via localStorage."
    },
    {
      "id": "TC-0.2",
      "title": "Universal DataTable Sticky Actions Column Pinning",
      "category": "UX & A11y",
      "userStoryId": "US-0.2",
      "targetPersona": "Operations Specialist",
      "severity": "High",
      "preconditions": "Viewport width set to 1024px; dataset contains 12+ columns.",
      "steps": [
        "1. Scroll data table horizontally to the far right edge.",
        "2. Observe the pinned rightmost 'Actions' (⋯) column.",
        "3. Click actions trigger button to open popup menu."
      ],
      "expectedResult": "Actions column stays pinned at exactly 48px width with semi-transparent border shadow (z-index: 20). Action dropdown menu opens without clipping outside the scroll viewport."
    },
    {
      "id": "TC-0.3",
      "title": "Windowed Pagination Numeric Window Bounds",
      "category": "Edge Case",
      "userStoryId": "US-0.2",
      "targetPersona": "Operations Specialist",
      "severity": "High",
      "preconditions": "Table loaded with 1,340 total rows (134 pages at 10 rows/page).",
      "steps": [
        "1. Navigate from page 1 to page 5.",
        "2. Jump directly to page 134 via pager."
      ],
      "expectedResult": "Pager displays windowed format '1 … 4 5 6 … 134', completely preventing legacy bug where 134 individual buttons wrapped over 5 lines."
    },
    {
      "id": "TC-0.4",
      "title": "Destructive Action Confirmation with Mandatory Reason",
      "category": "Security / RBAC",
      "userStoryId": "US-0.3",
      "targetPersona": "Operations Auditor",
      "severity": "Critical",
      "preconditions": "Admin user on tenant management row.",
      "steps": [
        "1. Click 'Suspend Tenant' button.",
        "2. Attempt to click 'Confirm Suspend' immediately.",
        "3. Select reason from dropdown, enter reason notes, and click 'Confirm'."
      ],
      "expectedResult": "Confirm button remains strictly disabled until a reason code is selected. Modal traps keyboard focus (Tab, Esc). Once confirmed, dispatches destructive mutation and logs reason in audit log."
    },
    {
      "id": "TC-0.5",
      "title": "SwitchRow Left-0 Knob Alignment & Keyboard Toggle",
      "category": "UX & A11y",
      "userStoryId": "US-0.3",
      "targetPersona": "Accessibility Auditor",
      "severity": "Medium",
      "preconditions": "Form containing SwitchRow toggle component.",
      "steps": [
        "1. Tab to the switch using keyboard focus.",
        "2. Press Spacebar or Enter to toggle.",
        "3. Inspect knob position in OFF vs ON states."
      ],
      "expectedResult": "Focus ring appears with 2px offset. When OFF, knob sits at left: 4px (translate-x-1). When ON, knob slides smoothly to left: 24px (translate-x-6). Knob never clips outside pill track boundaries."
    }
  ],
  "1": [
    {
      "id": "TC-1.1",
      "title": "Two-Level Collapsible Sidebar Responsive Rail",
      "category": "Happy Path",
      "userStoryId": "US-1.1",
      "targetPersona": "Daily CRM Operator",
      "severity": "Critical",
      "preconditions": "Desktop viewport (1440px).",
      "steps": [
        "1. Click sidebar toggle button to collapse.",
        "2. Hover over collapsed module icons.",
        "3. Click sub-item from flyout."
      ],
      "expectedResult": "Sidebar width animates smoothly from 260px to 72px. Main content margin adjusts from ml-[260px] to ml-[72px] without layout shift. Floating flyout menu appears on hover with active item highlight."
    },
    {
      "id": "TC-1.2",
      "title": "Dynamic Route Breadcrumb Entity Name Resolution",
      "category": "Happy Path",
      "userStoryId": "US-1.2",
      "targetPersona": "Support Agent",
      "severity": "High",
      "preconditions": "Customer record #23488 exists with name 'Acme Logistics Ltd'.",
      "steps": [
        "1. Navigate to /crm/customers/23488.",
        "2. Inspect breadcrumb trail in header.",
        "3. Click 'Customers' parent crumb."
      ],
      "expectedResult": "Breadcrumb displays 'Home > Customer Management > Customers > Acme Logistics Ltd (#23488)' rather than raw token. Clicking parent crumb returns to customer list with preserved filter state."
    },
    {
      "id": "TC-1.3",
      "title": "Guarded Reference Data Deletion for Active Currencies",
      "category": "Edge Case",
      "userStoryId": "US-1.3",
      "targetPersona": "System Administrator",
      "severity": "Critical",
      "preconditions": "Currency NGN assigned to 14 active subscription plans.",
      "steps": [
        "1. Open /crm/settings/reference.",
        "2. Click 'Currencies' tab.",
        "3. Attempt to toggle OFF currency NGN."
      ],
      "expectedResult": "System detects activePlanCount > 0, blocks toggle mutation, and displays error toast: 'NGN is used by 14 active plans and cannot be deactivated'."
    },
    {
      "id": "TC-1.4",
      "title": "User Favorites Starring & LocalStorage Persistence",
      "category": "Happy Path",
      "userStoryId": "US-1.1",
      "targetPersona": "Daily CRM Operator",
      "severity": "Medium",
      "preconditions": "Customer list filtered by status=overdue&tier=enterprise.",
      "steps": [
        "1. Click star icon in header.",
        "2. Verify sidebar Favorites group.",
        "3. Refresh browser page and click the favorite link."
      ],
      "expectedResult": "Favorite is saved to sidebar as 'Customers · Overdue Enterprise'. Clicking it loads the exact filtered dataset with query params intact. State survives browser restart."
    }
  ],
  "2": [
    {
      "id": "TC-2.1",
      "title": "Multi-Currency Pricing Matrix Computation",
      "category": "Happy Path",
      "userStoryId": "US-2.2",
      "targetPersona": "Billing Manager",
      "severity": "Critical",
      "preconditions": "Plan 'Cloud ERP Enterprise' created with base currency NGN.",
      "steps": [
        "1. Define pricing in NGN (₦250,000/mo).",
        "2. Add USD ($250/mo) and GBP (£200/mo) price overrides.",
        "3. Save plan."
      ],
      "expectedResult": "Matrix validates all active currencies. Checkout flows in USD charge exactly $250 without unexpected conversion discrepancies."
    },
    {
      "id": "TC-2.2",
      "title": "Volume Discount Tier Range Validation & Zero Gap Check",
      "category": "Edge Case",
      "userStoryId": "US-2.2",
      "targetPersona": "Product Manager",
      "severity": "High",
      "preconditions": "Creating tiered pricing for SMS add-on credits.",
      "steps": [
        "1. Create Tier 1: 1–1,000 units at ₦4.00.",
        "2. Attempt to create Tier 2: 1,005–5,000 units at ₦3.50 (creating a 5-unit gap)."
      ],
      "expectedResult": "Form validation catches the gap: 'Tier 2 start quantity must be 1,001 to prevent uncovered billing quantities'. Save button disabled."
    },
    {
      "id": "TC-2.3",
      "title": "Dynamic Service Dependency Resolver in Bundle Builder",
      "category": "Happy Path",
      "userStoryId": "US-2.3",
      "targetPersona": "Product Operations Lead",
      "severity": "High",
      "preconditions": "Add-on 'Advanced AI Assistant' requires parent plan 'Pro' or 'Enterprise'.",
      "steps": [
        "1. Open Bundle Builder.",
        "2. Attempt to bundle 'Advanced AI Assistant' with 'Starter' plan."
      ],
      "expectedResult": "Builder flags dependency conflict: 'Starter plan does not meet prerequisite requirements for Advanced AI Assistant'."
    },
    {
      "id": "TC-2.4",
      "title": "Draft vs Live Plan State Guard on Checkout Enrollment",
      "category": "Security / RBAC",
      "userStoryId": "US-2.1",
      "targetPersona": "Billing Administrator",
      "severity": "Critical",
      "preconditions": "Plan plan_draft_99 has status 'Draft'.",
      "steps": [
        "1. Send customer checkout enrollment request with plan_draft_99."
      ],
      "expectedResult": "API returns HTTP 422 Unprocessable Entity: 'Cannot enroll customer into Draft commercial plan. Publish plan to Live before onboarding.'"
    }
  ],
  "3": [
    {
      "id": "TC-3.1",
      "title": "Unified Customer 360 Consolidated Timeline",
      "category": "Happy Path",
      "userStoryId": "US-3.1",
      "targetPersona": "Customer Success Lead",
      "severity": "Critical",
      "preconditions": "Customer #1044 has 3 invoices, 2 support tickets, and 1 renewal.",
      "steps": [
        "1. Open Customer 360 overview for #1044.",
        "2. Inspect Activity Stream.",
        "3. Filter stream by 'Billing'."
      ],
      "expectedResult": "Timeline aggregates events chronologically with entity badges. Filtering by 'Billing' displays only invoice-related entries in < 50ms without full page reload."
    },
    {
      "id": "TC-3.2",
      "title": "Defensive Guard on Customer Account Archiving",
      "category": "Edge Case",
      "userStoryId": "US-3.3",
      "targetPersona": "Compliance Auditor",
      "severity": "Critical",
      "preconditions": "Customer has active monthly subscription in status Live.",
      "steps": [
        "1. Open customer actions menu.",
        "2. Click 'Archive Customer'.",
        "3. Observe ConfirmDialog."
      ],
      "expectedResult": "Modal displays warning: 'Customer has active subscription Pro Cloud. Archiving will pause recurring billing and cancel scheduled invoices.' Mandatory reason dropdown required before proceed button enables."
    },
    {
      "id": "TC-3.3",
      "title": "Account Health Score Calculation Engine",
      "category": "Happy Path",
      "userStoryId": "US-3.2",
      "targetPersona": "Account Manager",
      "severity": "High",
      "preconditions": "Customer has 0 overdue invoices and 15 team logins this week.",
      "steps": [
        "1. View Health Badge in customer header.",
        "2. Hover over health pill."
      ],
      "expectedResult": "Health badge renders Healthy (green) with 95/100 composite score breakdown tooltip (Payment timeliness: 100%, Engagement: 90%, Tickets: 95%)."
    },
    {
      "id": "TC-3.4",
      "title": "High-Performance FilterBar Debounce on 10,000 Customer Records",
      "category": "Performance & Scale",
      "userStoryId": "US-3.1",
      "targetPersona": "QA Automation Engineer",
      "severity": "High",
      "preconditions": "Customer dataset populated with 10,000 rows.",
      "steps": [
        "1. Type rapidly into Customer search input: 'Zenith Logistics'.",
        "2. Monitor network/render dispatch frequency."
      ],
      "expectedResult": "Debounce delay of 250ms prevents intermediate render churn; single query executes at end of typing stream; table filter response executes in < 30ms."
    }
  ],
  "4": [
    {
      "id": "TC-4.1",
      "title": "Invoice PDF Generation & Tax / WHT Breakdown",
      "category": "Happy Path",
      "userStoryId": "US-4.1",
      "targetPersona": "Billing Accountant",
      "severity": "Critical",
      "preconditions": "Customer invoice #INV-2026-0042 with subtotal ₦1,000,000, VAT 7.5%, WHT 5%.",
      "steps": [
        "1. Open invoice detail view.",
        "2. Verify financial calculation summary.",
        "3. Click 'Download PDF'."
      ],
      "expectedResult": "Line items correctly calculate: Subtotal: ₦1,000,000; VAT: +₦75,000; WHT: -₦50,000; Net Payable: ₦1,025,000. PDF generates cleanly with company header and tax ID."
    },
    {
      "id": "TC-4.2",
      "title": "Payment Double-Charge Prevention via Idempotency Key",
      "category": "Edge Case",
      "userStoryId": "US-4.2",
      "targetPersona": "Payment Operations Engineer",
      "severity": "Critical",
      "preconditions": "Network latency simulated at 2,000ms.",
      "steps": [
        "1. User clicks 'Pay Now' on ₦50,000 invoice.",
        "2. User rapidly double-clicks the submit button within 150ms."
      ],
      "expectedResult": "Submit button immediately locks into loading state with spinner. Both requests send identical Idempotency-Key header; backend returns HTTP 200 for the first and deduplicates the second, ensuring customer is charged exactly once."
    },
    {
      "id": "TC-4.3",
      "title": "Three-Stage Dunning Workflow with Automated Grace Period",
      "category": "Happy Path",
      "userStoryId": "US-4.3",
      "targetPersona": "Collections Specialist",
      "severity": "High",
      "preconditions": "Invoice becomes 1 day overdue.",
      "steps": [
        "1. Observe dunning state transitions on Day 1, Day 7, Day 14, and Day 15."
      ],
      "expectedResult": "Day 1: Dunning Stage 1 email sent (Soft Reminder). Day 7: Stage 2 SMS + Email sent (Urgent Notice). Day 14: Final Warning sent. Day 15: Account status transitions to Suspended and webhook notifies tenant gateway."
    },
    {
      "id": "TC-4.4",
      "title": "Offline Bank Transfer Receipt Verification & Maker-Checker Gate",
      "category": "Security / RBAC",
      "userStoryId": "US-4.2",
      "targetPersona": "Treasury Officer",
      "severity": "High",
      "preconditions": "Offline bank transfer receipt uploaded by customer for ₦500,000.",
      "steps": [
        "1. Finance Clerk verifies receipt and submits approval.",
        "2. System checks if Maker is the same as Checker."
      ],
      "expectedResult": "Finance Clerk cannot self-approve their own submission; secondary supervisor role required to approve invoice to 'Paid' status."
    }
  ],
  "5": [
    {
      "id": "TC-5.1",
      "title": "Kanban Pipeline Drag-and-Drop Stage Transition",
      "category": "Happy Path",
      "userStoryId": "US-5.1",
      "targetPersona": "Sales Operations Lead",
      "severity": "Critical",
      "preconditions": "Opportunity 'Apex Bank ERP' in stage 'Discovery' (₦12,000,000).",
      "steps": [
        "1. Drag opportunity card from 'Discovery' column to 'Proposal Sent' column."
      ],
      "expectedResult": "Card animates smoothly into new column. Pipeline header metrics update instantly: Discovery total decreases by ₦12M; Proposal Sent total increases by ₦12M. Audit log records stage transition."
    },
    {
      "id": "TC-5.2",
      "title": "Lead Conversion to Active Customer & Duplicate Check",
      "category": "Edge Case",
      "userStoryId": "US-5.2",
      "targetPersona": "Inside Sales Representative",
      "severity": "High",
      "preconditions": "Lead with company name 'Sterling Oil' and email finance@sterling.ng.",
      "steps": [
        "1. Click 'Convert to Customer'.",
        "2. Verify duplicate check against existing customer database."
      ],
      "expectedResult": "If email matches existing tenant, system prompts: 'Matching customer record found (#1092). Merge or link lead instead of creating duplicate?'."
    },
    {
      "id": "TC-5.3",
      "title": "Partner Commission Tier Tiering & Payout Ledger",
      "category": "Happy Path",
      "userStoryId": "US-5.4",
      "targetPersona": "Partner Program Manager",
      "severity": "High",
      "preconditions": "Partner 'AfriTech Reseller' has Gold tier (15% commission rate).",
      "steps": [
        "1. Customer referred by AfriTech completes ₦2,000,000 payment.",
        "2. Check Partner Commission ledger."
      ],
      "expectedResult": "Ledger generates pending commission line item of ₦300,000 (15%) tied to invoice ID, with payout status set to 'Pending Settlement'."
    },
    {
      "id": "TC-5.4",
      "title": "Bulk Lead Import CSV Validation with Row-Level Error Highlighting",
      "category": "Performance & Scale",
      "userStoryId": "US-5.3",
      "targetPersona": "Marketing Operations",
      "severity": "Medium",
      "preconditions": "CSV file containing 1,500 leads with 3 invalid phone numbers.",
      "steps": [
        "1. Upload leads.csv.",
        "2. Observe import validation preview table."
      ],
      "expectedResult": "1,497 valid leads flagged green; 3 invalid rows highlighted with exact cell error ('Invalid E.164 phone format') with option to fix inline or skip."
    }
  ],
  "6": [
    {
      "id": "TC-6.1",
      "title": "Multi-Channel Triggered Event Message Dispatch",
      "category": "Happy Path",
      "userStoryId": "US-6.1",
      "targetPersona": "Lifecycle Marketing Manager",
      "severity": "Critical",
      "preconditions": "Event rule configured: event: payment.succeeded -> send SMS + Email.",
      "steps": [
        "1. Trigger payment.succeeded event webhook."
      ],
      "expectedResult": "Message engine evaluates dynamic tags ({{customer.name}}, {{invoice.amount}}), compiles template, and dispatches to SMS gateway and Email SMTP in < 250ms."
    },
    {
      "id": "TC-6.2",
      "title": "Secondary Provider Fallback on Primary Gateway Timeout",
      "category": "Edge Case",
      "userStoryId": "US-6.3",
      "targetPersona": "DevOps / SRE",
      "severity": "Critical",
      "preconditions": "Primary SMS provider simulated returning HTTP 504 Gateway Timeout.",
      "steps": [
        "1. Dispatch outbound campaign batch of 50 messages."
      ],
      "expectedResult": "Circuit breaker trips after 2 consecutive timeouts; remaining 48 messages automatically reroute through secondary gateway with zero message drop."
    },
    {
      "id": "TC-6.3",
      "title": "Customer Opt-Out & Regulatory Compliance Gate",
      "category": "Security / RBAC",
      "userStoryId": "US-6.2",
      "targetPersona": "Compliance Auditor",
      "severity": "High",
      "preconditions": "Customer has opted out of marketing communications (marketing_opt_in: false).",
      "steps": [
        "1. Marketing manager launches promotional broadcast campaign."
      ],
      "expectedResult": "Campaign audience filter strictly excludes opted-out customer. Excluded count logged in campaign pre-flight summary with reason 'Unsubscribed'."
    },
    {
      "id": "TC-6.4",
      "title": "Real-Time Campaign Delivery Analytics & Bounce Rate Telemetry",
      "category": "Happy Path",
      "userStoryId": "US-6.4",
      "targetPersona": "Growth Marketer",
      "severity": "Medium",
      "preconditions": "Campaign dispatched to 5,000 contacts.",
      "steps": [
        "1. Open Campaign Telemetry view.",
        "2. Observe live progress ring."
      ],
      "expectedResult": "Displays delivered (98.4%), hard bounces (0.8%), soft bounces (0.8%), and open rate (34.2%) with real-time websocket feed."
    }
  ],
  "7": [
    {
      "id": "TC-7.1",
      "title": "Granular RBAC Permission Matrix Enforcement",
      "category": "Security / RBAC",
      "userStoryId": "US-7.1",
      "targetPersona": "Security Officer",
      "severity": "Critical",
      "preconditions": "User account assigned 'Billing Specialist' role (lacks users:manage and settings:edit).",
      "steps": [
        "1. User logs in.",
        "2. User attempts to browse directly to /crm/settings/rbac."
      ],
      "expectedResult": "Route guard intercepts navigation and displays 403 Forbidden tile. Sidebar hides Administration menu entirely. API requests to /api/v2/admin/roles return HTTP 403."
    },
    {
      "id": "TC-7.2",
      "title": "Live API Key Generation & One-Time Secret Reveal",
      "category": "Security / RBAC",
      "userStoryId": "US-7.2",
      "targetPersona": "Developer / Integrator",
      "severity": "Critical",
      "preconditions": "Admin opening /crm/settings/apikeys.",
      "steps": [
        "1. Click 'Generate API Key'.",
        "2. Enter key label and scopes.",
        "3. Observe secret modal.",
        "4. Close modal and refresh page."
      ],
      "expectedResult": "Full secret (e.g. ck_live_8f92a1...) displayed inside focus-trapped dialog with 'Copy to Clipboard' CTA and warning. Subsequent list views display only masked prefix ck_live_8f92...••••."
    },
    {
      "id": "TC-7.3",
      "title": "Tamper-Evident Immutable Audit Log Integrity",
      "category": "Security / RBAC",
      "userStoryId": "US-7.3",
      "targetPersona": "Compliance Auditor",
      "severity": "Critical",
      "preconditions": "Tenant state change executed (user suspended).",
      "steps": [
        "1. Open Audit Log table.",
        "2. Verify log record details."
      ],
      "expectedResult": "Log entry captures Actor ID, IP Address, User Agent, Timestamp (UTC), Action (USER_SUSPEND), Target ID, and reason note. Audit log rows cannot be edited or deleted by any user or administrator."
    },
    {
      "id": "TC-7.4",
      "title": "Multi-Factor Authentication (2FA) TOTP Enforcement on Admin Login",
      "category": "Security / RBAC",
      "userStoryId": "US-7.4",
      "targetPersona": "System Administrator",
      "severity": "High",
      "preconditions": "Tenant policy enforces mandatory 2FA for Super Admin role.",
      "steps": [
        "1. Super Admin enters username and password.",
        "2. Observe 2FA challenge screen."
      ],
      "expectedResult": "Login halted at 6-digit TOTP verification screen. Session token is not issued until valid authenticator code is entered; 3 failed attempts locks login for 15 minutes."
    }
  ],
  "8": [
    {
      "id": "TC-8.1",
      "title": "End-to-End API Latency & p95 Benchmark",
      "category": "Performance & Scale",
      "userStoryId": "US-8.1",
      "targetPersona": "Performance Engineer",
      "severity": "Critical",
      "preconditions": "Load testing cluster simulating 250 concurrent users browsing customers and invoices.",
      "steps": [
        "1. Execute 10-minute steady-state load test against /api/v2/customers and /api/v2/invoices."
      ],
      "expectedResult": "p95 latency remains <= 180ms; 0 database connection pool timeouts; error rate < 0.05%."
    },
    {
      "id": "TC-8.2",
      "title": "Zero-Downtime Blue-Green Deployment Rollout",
      "category": "Happy Path",
      "userStoryId": "US-8.3",
      "targetPersona": "Release Manager / SRE",
      "severity": "Critical",
      "preconditions": "Staging environment verified with green health check.",
      "steps": [
        "1. Deploy v2 build to Green cluster.",
        "2. Execute automated smoke tests.",
        "3. Switch production load balancer traffic from Blue to Green."
      ],
      "expectedResult": "Active customer websocket sessions and billing API calls experience zero dropped connections during cutover. System telemetry indicates 100% traffic shift in < 5 seconds."
    },
    {
      "id": "TC-8.3",
      "title": "Automated Canary Rollback on Elevated Error Rate",
      "category": "Edge Case",
      "userStoryId": "US-8.3",
      "targetPersona": "Site Reliability Engineer",
      "severity": "Critical",
      "preconditions": "Canary deployment serving 5% of production traffic.",
      "steps": [
        "1. Inject artificial 5xx error rate (> 1%) on canary target."
      ],
      "expectedResult": "Telemetry monitoring triggers alert within 60 seconds; automated rollback script resets load balancer routing to stable version without human intervention."
    },
    {
      "id": "TC-8.4",
      "title": "Cross-Browser Regression: Chrome, Firefox, Safari & Edge",
      "category": "UX & A11y",
      "userStoryId": "US-8.2",
      "targetPersona": "Lead QA Engineer",
      "severity": "High",
      "preconditions": "Automated Playwright matrix testing on desktop viewports.",
      "steps": [
        "1. Run end-to-end regression across Chromium, WebKit, and Firefox."
      ],
      "expectedResult": "100% test passes across all 3 browsers; 0 CSS grid alignment regressions; 0 font rendering shifts between Windows and macOS."
    }
  ]
};
