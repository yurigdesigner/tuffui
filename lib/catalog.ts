export const categories = [
  { id: "foundations", name: "Foundations" },
  { id: "screens", name: "Screens" },
  { id: "conversation", name: "Conversation" },
  { id: "tools", name: "Tools & Approvals" },
  { id: "generative", name: "Interactive Answers" },
  { id: "planning", name: "Planning & Execution" },
  { id: "observability", name: "Observability" },
  { id: "usage", name: "Settings & Usage" },
] as const;

export type CategoryId = (typeof categories)[number]["id"];

export type CatalogEntry = {
  slug: string;
  name: string;
  description: string;
  category: CategoryId;
  /** Variant names shown in the preview switcher; the first is the default. */
  variants: string[];
  /** `planned` entries show in nav but have no preview yet. */
  status: "ready" | "planned";
  /** Release date (YYYY-MM-DD); dated entries lead the home grid, newest first. */
  added?: string;
};

export const catalog: CatalogEntry[] = [
  {
    slug: "surface",
    name: "Surface",
    description:
      "Shell, Panel, Inset, IconTile and ShellHeader — the borderless layers every component is framed with.",
    category: "foundations",
    variants: ["Layers", "Headers"],
    status: "ready",
  },
  {
    slug: "action-button",
    name: "Action Button",
    description:
      "Silver primary, secondary, quiet and danger buttons in two sizes, with icons, loading and icon-only buttons.",
    category: "foundations",
    variants: ["Variants", "States"],
    status: "ready",
  },
  {
    slug: "choice-controls",
    name: "Choice Controls",
    description:
      "Switch, borderless Checkbox with a mixed state, and a RadioGroup with arrow-key navigation.",
    category: "foundations",
    variants: ["Controls", "With labels"],
    status: "ready",
  },
  {
    slug: "status-pill",
    name: "Status Pill",
    description:
      "Tinted status pills in five tones with icon or dot, plus a mono Tag for models, branches and transports.",
    category: "foundations",
    variants: ["Tones", "Tags"],
    status: "ready",
  },
  {
    slug: "segmented-control",
    name: "Segmented Control",
    description:
      "Radio-style segmented switch with a sliding active pill that jumps instantly from the keyboard.",
    category: "foundations",
    variants: ["Default", "Sizes"],
    status: "ready",
  },
  {
    slug: "progress-bar",
    name: "Progress Bar",
    description:
      "Progress and meter bars in five tones with optional stripes, plus a stacked SegmentedBar.",
    category: "foundations",
    variants: ["Bars", "Segmented"],
    status: "ready",
  },
  {
    slug: "rolling-number",
    name: "Rolling Number",
    description:
      "Odometer-style number: each digit rolls to its new value, units and separators stay put.",
    category: "foundations",
    variants: ["Counter", "Currency"],
    status: "ready",
  },
  {
    slug: "text-field",
    name: "Text Field",
    description:
      "Borderless TextField, SearchField with clear and TextArea, with label, description and error wiring.",
    category: "foundations",
    variants: ["Fields", "States"],
    status: "ready",
  },
  {
    slug: "tooltip-hint",
    name: "Tooltip",
    description:
      "Hint anchored to its trigger: scales in from the trigger side, opens instantly once one is warm.",
    category: "foundations",
    variants: ["Default", "Placement"],
    status: "ready",
  },
  {
    slug: "action-menu",
    name: "Action Menu",
    description:
      "Dropdown and right-click menus — items with icons and shortcuts, submenus, checkable items and a destructive group.",
    category: "foundations",
    variants: ["Dropdown", "Context"],
    status: "ready",
  },
  {
    slug: "popover-panel",
    name: "Popover Panel",
    description:
      "A panel anchored to its trigger — grows from it, closes on outside click or Esc, keeps focus inside.",
    category: "foundations",
    variants: ["Default", "Form"],
    status: "ready",
  },
  {
    slug: "modal-sheet",
    name: "Modal Sheet",
    description:
      "Centered dialog and edge sheet (drawer) — focus trap, scroll lock, Esc and backdrop to close.",
    category: "foundations",
    variants: ["Dialog", "Sheet"],
    status: "ready",
  },
  {
    slug: "toast-stack",
    name: "Toast Stack",
    description:
      "Notifications that stack, expand on hover, pause while hovered, swipe or click to dismiss, with actions.",
    category: "foundations",
    variants: ["Default", "Actions"],
    status: "ready",
  },
  {
    slug: "select-field",
    name: "Select Field",
    description:
      "Select and searchable combobox — options with icons and hints, groups, keyboard typeahead.",
    category: "foundations",
    variants: ["Select", "Combobox"],
    status: "ready",
  },
  {
    slug: "tab-panels",
    name: "Tab Panels",
    description:
      "Tabs with panels — sliding indicator, keyboard navigation, lazy panels and counts.",
    category: "foundations",
    variants: ["Default", "Pills"],
    status: "ready",
  },
  {
    slug: "disclosure",
    name: "Disclosure",
    description:
      "Accordion and single collapsible sections with smooth height animation.",
    category: "foundations",
    variants: ["Accordion", "Single"],
    status: "ready",
  },
  {
    slug: "agent-avatar",
    name: "Agent Avatar",
    description:
      "Avatars for agents and people — initials or image, presence and activity state, stacked groups.",
    category: "foundations",
    variants: ["Single", "Group"],
    status: "ready",
  },
  {
    slug: "loading-skeleton",
    name: "Loading Skeleton",
    description: "Placeholders for answers, lists and cards while they load.",
    category: "foundations",
    variants: ["Message", "Cards"],
    status: "ready",
  },
  {
    slug: "range-slider",
    name: "Range Slider",
    description:
      "Single and range sliders with steps, marks and value labels — for temperature, length, budgets.",
    category: "foundations",
    variants: ["Single", "Range"],
    status: "ready",
  },
  {
    slug: "key-hint",
    name: "Key Hint",
    description:
      "Keyboard shortcut hints that adapt to the platform — Cmd on Mac, Ctrl elsewhere.",
    category: "foundations",
    variants: ["Keys", "Inline"],
    status: "ready",
  },
  {
    slug: "loader",
    name: "Loader",
    description:
      "Spinner and thinking indicators in a few sizes, with an accessible label.",
    category: "foundations",
    variants: ["Spinner", "Thinking"],
    status: "ready",
  },
  {
    slug: "empty-state",
    name: "Empty State",
    description: "Empty, no-results and error states with an icon, message and actions.",
    category: "foundations",
    variants: ["Empty", "Error"],
    status: "ready",
  },
  {
    slug: "date-field",
    name: "Date Field",
    description:
      "Calendar and date picker — month grid, ranges, keyboard navigation and min / max.",
    category: "foundations",
    variants: ["Calendar", "Picker"],
    status: "ready",
  },
  {
    slug: "drop-zone",
    name: "Drop Zone",
    description:
      "Drag-and-drop file target for a chat — accepts types and size limits, shows why a file was rejected.",
    category: "foundations",
    variants: ["Default", "Overlay"],
    status: "ready",
  },
  {
    slug: "ai-chat",
    name: "AI Chat",
    description:
      "A complete chat app screen — history sidebar, a thread with tool calls, cited answers and feedback, follow-up chips and a composer with a context meter.",
    category: "screens",
    variants: ["Conversation", "New chat"],
    status: "ready",
  },
  {
    slug: "coding-agent",
    name: "Coding Agent",
    description:
      "An agent working in a repo — chat with plan and permission requests on one side, file changes, terminal and a live preview on the other.",
    category: "screens",
    variants: ["Working", "Review"],
    status: "ready",
  },
  {
    slug: "data-answer",
    name: "Data Answer",
    description:
      "An analytics question answered with KPI cards, a chart and a table, plus follow-up questions to dig further.",
    category: "screens",
    variants: ["Overview", "Drill-down"],
    status: "ready",
  },
  {
    slug: "booking-assistant",
    name: "Booking Assistant",
    description:
      "An assistant that acts — compares options, picks a time, fills a form and confirms before it books.",
    category: "screens",
    variants: ["Plan trip", "Confirmed"],
    status: "ready",
  },
  {
    slug: "agent-console",
    name: "Agent Console",
    description:
      "A team view of agents in production — background runs, a trace, eval results, usage and rate limits.",
    category: "screens",
    variants: ["Overview", "Incident"],
    status: "ready",
  },
  {
    slug: "support-widget",
    name: "Support Widget",
    description:
      "A support bot embedded on a website — launcher bubble, quick replies, order lookup, handoff to a human and a rating at the end.",
    category: "screens",
    variants: ["Bot", "Handoff"],
    status: "ready",
  },
  {
    slug: "handoff-inbox",
    name: "Handoff Inbox",
    description:
      "Where people take over from the bot — escalated conversations by urgency, what the bot already did, reply and hand back.",
    category: "screens",
    variants: ["Inbox", "Takeover"],
    status: "ready",
  },
  {
    slug: "streaming-message",
    name: "Streaming Message",
    description:
      "Assistant message with token streaming, collapsible reasoning, citation chips and copy / retry actions.",
    category: "conversation",
    variants: ["Default", "Reasoning", "Error"],
    status: "ready",
  },
  {
    slug: "agent-status",
    name: "Agent Status",
    description:
      "Live activity line for a working agent — current step, rotating detail, elapsed time and a stop action.",
    category: "conversation",
    variants: ["Line", "Steps"],
    status: "ready",
  },
  {
    slug: "message-branches",
    name: "Message Branches",
    description:
      "Switch between regenerated answers and edited prompts — arrows, a mini branch map, and direction-aware swaps.",
    category: "conversation",
    variants: ["Inline", "Map"],
    status: "ready",
  },
  {
    slug: "response-feedback",
    name: "Response Feedback",
    description:
      "Thumbs up or down under an answer; a down vote opens reason chips and a note, then settles into a thank-you.",
    category: "conversation",
    variants: ["Inline", "Detailed"],
    status: "ready",
  },
  {
    slug: "agent-composer",
    name: "Agent Composer",
    description:
      "Prompt input with Ask / Plan / Act modes, a context tray with token counts and messages that queue while the agent works.",
    category: "conversation",
    variants: ["Default", "Minimal"],
    status: "ready",
  },
  {
    slug: "agent-question",
    name: "Agent Question",
    description:
      "Agent asks with choice cards, marks its own suggestion and reason, and accepts a pick, several picks or free text.",
    category: "conversation",
    variants: ["Single", "Multiple"],
    status: "ready",
  },
  {
    slug: "tool-approval-queue",
    name: "Tool Approval Queue",
    description:
      "Triage pending tool calls by risk: select several, grant once, for the session or always, and undo from the resolved log.",
    category: "tools",
    variants: ["Grouped", "Flat"],
    status: "ready",
  },
  {
    slug: "tool-call-block",
    name: "Tool Call Block",
    description:
      "Inline chat card for a tool call: name, collapsible JSON args, status, duration and a result preview.",
    category: "tools",
    variants: ["Inline", "In chat"],
    status: "ready",
  },
  {
    slug: "file-changes",
    name: "File Changes",
    description:
      "Split review: a file tree on one side, hunks on the other — keep or revert each hunk, then apply the result.",
    category: "tools",
    variants: ["Split", "Stacked"],
    status: "ready",
  },
  {
    slug: "terminal-output",
    name: "Terminal Output",
    description:
      "Streaming command output with stdout / stderr lines, exit status, duration, copy and stop.",
    category: "tools",
    variants: ["Streaming", "Failed"],
    status: "ready",
  },
  {
    slug: "mcp-servers",
    name: "MCP Servers",
    description:
      "Connected MCP servers with status, auth prompts and reconnect — expand one to switch individual tools on or off.",
    category: "tools",
    variants: ["Servers", "Tools"],
    status: "ready",
  },
  {
    slug: "background-agents",
    name: "Background Agents Panel",
    description:
      "Agents working in the background as a grid of live tiles or a compact dock that expands into the selected agent.",
    category: "planning",
    variants: ["Grid", "Dock"],
    status: "ready",
  },
  {
    slug: "checkpoint-timeline",
    name: "Checkpoint Timeline",
    description:
      "Checkpoints the agent made along the way — scrub through turns, see what changed, restore to any point.",
    category: "planning",
    variants: ["Timeline", "Compact"],
    status: "ready",
  },
  {
    slug: "run-trace",
    name: "Run Trace",
    description:
      "Flame graph of an agent run with click-to-zoom spans, plus a breakdown of where time, tokens and cost went.",
    category: "observability",
    variants: ["Flame", "Breakdown"],
    status: "ready",
  },
  {
    slug: "eval-results",
    name: "Eval Results",
    description:
      "An eval run as a grid of cases — pass, fail or regressed vs the baseline — with per-case input, expected and actual.",
    category: "observability",
    variants: ["Grid", "Compare"],
    status: "ready",
  },
  {
    slug: "lap-timer",
    name: "Lap Timer",
    description:
      "A pipeline run as a stopwatch — the hand sweeps through each stage's sector, with splits and the delta against the best lap.",
    category: "observability",
    variants: ["Default"],
    status: "ready",
    added: "2026-11-09",
  },
  {
    slug: "eval-race",
    name: "Eval Race",
    description:
      "Models racing through an eval set on an oval track — one lap per batch of cases, with standings, gaps and the fastest lap.",
    category: "observability",
    variants: ["Race", "Standings"],
    status: "ready",
    added: "2026-11-09",
  },
  {
    slug: "tool-call-graph",
    name: "Tool Call Graph",
    description:
      "An agent fanned out to the tools it calls — calls, latency and error rate per edge, with the hottest path picked out.",
    category: "observability",
    variants: ["Default"],
    status: "ready",
    added: "2026-11-09",
  },
  {
    slug: "deploy-timeline",
    name: "Deploy Timeline",
    description:
      "Prompt and model versions on a timeline over the eval score they shipped with — regressions, rollbacks and the live canary.",
    category: "observability",
    variants: ["Default"],
    status: "ready",
    added: "2026-11-09",
  },
  {
    slug: "context-window-meter",
    name: "Context Window Meter",
    description:
      "Token usage by segment — system, history, files, tools — with a near-limit warning and a compact action.",
    category: "usage",
    variants: ["Card", "Inline", "Near limit"],
    status: "ready",
  },
  {
    slug: "memory-panel",
    name: "Memory Panel",
    description:
      "What the agent remembers about the user and project — search, scopes, inline edit and forget.",
    category: "usage",
    variants: ["Panel", "Compact"],
    status: "ready",
  },
  {
    slug: "usage-summary",
    name: "Usage Summary",
    description: "Tokens and cost over time, split by model, against a monthly budget.",
    category: "usage",
    variants: ["Week", "Month"],
    status: "ready",
  },
  {
    slug: "rate-limits",
    name: "Rate Limits",
    description:
      "Requests and tokens per minute as refilling buckets, with a retry-after countdown and queued calls when throttled.",
    category: "usage",
    variants: ["Healthy", "Throttled"],
    status: "ready",
  },
  {
    slug: "chat-thread",
    name: "Chat Thread",
    description:
      "The conversation itself — user and assistant turns, grouping, date dividers, unread marker and a jump-to-latest pill.",
    category: "conversation",
    variants: ["Default", "Dense"],
    status: "ready",
  },
  {
    slug: "user-message",
    name: "User Message",
    description:
      "A sent prompt with attachments, edit-in-place and resend, copy, and a delivery state.",
    category: "conversation",
    variants: ["Default", "With attachments"],
    status: "ready",
  },
  {
    slug: "conversation-list",
    name: "Conversation List",
    description:
      "Chat history for a sidebar — search, pinned and dated groups, rename inline, archive and delete with undo.",
    category: "conversation",
    variants: ["Sidebar", "Compact"],
    status: "ready",
  },
  {
    slug: "prompt-suggestions",
    name: "Prompt Suggestions",
    description: "Starter prompts for an empty chat and follow-up chips under an answer.",
    category: "conversation",
    variants: ["Cards", "Chips"],
    status: "ready",
  },
  {
    slug: "attachment-preview",
    name: "Attachment Preview",
    description:
      "Images and files attached to a prompt — thumbnails, type and size, upload progress, retry and remove.",
    category: "conversation",
    variants: ["Grid", "Uploading"],
    status: "ready",
  },
  {
    slug: "code-block",
    name: "Code Block",
    description:
      "Code in an answer — filename, language, line numbers, wrap toggle, copy and collapse for long snippets.",
    category: "conversation",
    variants: ["Default", "Long"],
    status: "ready",
  },
  {
    slug: "source-list",
    name: "Source List",
    description:
      "Citations behind an answer — numbered footnotes with hover previews and a panel of every source used.",
    category: "conversation",
    variants: ["Footnotes", "Panel"],
    status: "ready",
  },
  {
    slug: "chart-card",
    name: "Chart Card",
    description:
      "A chart the agent answers with — bar, line, area or donut, with tooltips, legend toggles and animated data.",
    category: "generative",
    variants: ["Bar", "Line", "Area", "Donut"],
    status: "ready",
  },
  {
    slug: "dot-histogram",
    name: "Dot Histogram",
    description:
      "A distribution as stacked dots — every sample visible, median and p95 marked, samples past a limit such as a timeout flagged.",
    category: "generative",
    variants: ["Latency", "Tokens"],
    status: "ready",
  },
  {
    slug: "tick-gauge",
    name: "Tick Gauge",
    description:
      "A meter drawn as ticks around an arc, with a target marker and the shortfall to it in red — success rates, SLOs, budgets.",
    category: "generative",
    variants: ["Below SLO", "Healthy"],
    status: "ready",
  },
  {
    slug: "mirror-strips",
    name: "Mirror Strips",
    description:
      "Rows of dot strips with two series mirrored around a line — compare rounds or weeks on one axis, with pinned columns and notes.",
    category: "generative",
    variants: ["Contract", "Pull requests"],
    status: "ready",
  },
  {
    slug: "radial-dots",
    name: "Radial Dots",
    description:
      "A cycle as rings of dots — hours of the day or days of the week, stacked by series, with the headline in the middle.",
    category: "generative",
    variants: ["Runs by hour", "By weekday"],
    status: "ready",
  },
  {
    slug: "match-field",
    name: "Match Field",
    description:
      "A fit field — candidates, bots or options placed by score around a centre, grouped into sectors, with threshold rings.",
    category: "generative",
    variants: ["Candidates", "Bots"],
    status: "ready",
  },
  {
    slug: "radar-chart",
    name: "Radar Chart",
    description:
      "Scores across several axes as a polygon, with a dashed bar to meet and each member's values as dots on the spokes.",
    category: "generative",
    variants: ["Team skills", "Model eval"],
    status: "ready",
  },
  {
    slug: "diverging-bars",
    name: "Diverging Bars",
    description:
      "Stacked daily columns with one series hanging below zero on its own scale — triaged vs escalated, solved vs handed off.",
    category: "generative",
    variants: ["Alerts", "Support"],
    status: "ready",
  },
  {
    slug: "blast-radius",
    name: "Blast Radius",
    description:
      "What a key, agent or tool can reach, hop by hop around a centre, with the affected paths in red.",
    category: "generative",
    variants: ["Leaked key", "Tool permissions"],
    status: "ready",
  },
  {
    slug: "iso-bars",
    name: "Iso Bars",
    description:
      "Isometric stacked bars in two rows — the main volume behind, rework or failures in front.",
    category: "generative",
    variants: ["Tokens", "Pipeline"],
    status: "ready",
  },
  {
    slug: "hex-density",
    name: "Hex Density",
    description:
      "A density map of two measures in hexagons, split by a threshold line — retrieved vs dropped, fast vs slow.",
    category: "generative",
    variants: ["Retrieval", "Latency"],
    status: "ready",
  },
  {
    slug: "data-table",
    name: "Data Table",
    description:
      "Tabular results — sortable columns, filter, pagination, row selection and copy as CSV.",
    category: "generative",
    variants: ["Table", "Selectable"],
    status: "ready",
  },
  {
    slug: "stat-grid",
    name: "Stat Grid",
    description:
      "KPI cards with rolling numbers, deltas and sparklines for a quick summary answer.",
    category: "generative",
    variants: ["KPIs", "Sparklines"],
    status: "ready",
  },
  {
    slug: "form-card",
    name: "Form Card",
    description:
      "A form the agent asks the user to fill — fields, selects, validation and a submitted state.",
    category: "generative",
    variants: ["Form", "Validation"],
    status: "ready",
  },
  {
    slug: "result-carousel",
    name: "Result Carousel",
    description:
      "A row of result cards — image, title, meta and an action — with snap scrolling and arrows.",
    category: "generative",
    variants: ["Cards", "Compact"],
    status: "ready",
  },
  {
    slug: "slot-picker",
    name: "Slot Picker",
    description:
      "Pick a time the agent proposed — days, free slots, time zone and a confirm step.",
    category: "generative",
    variants: ["Week", "Day"],
    status: "ready",
  },
  {
    slug: "confirmation-card",
    name: "Confirmation Card",
    description:
      "A summary of what the agent is about to do — line items, totals and confirm or edit before it acts.",
    category: "generative",
    variants: ["Summary", "Done"],
    status: "ready",
  },
  {
    slug: "json-viewer",
    name: "JSON Viewer",
    description:
      "Structured output as a collapsible tree — types, counts, search, copy path and copy value.",
    category: "generative",
    variants: ["Tree", "Raw"],
    status: "ready",
  },
  {
    slug: "artifact-panel",
    name: "Artifact Panel",
    description:
      "A side canvas for what the agent made — live preview and source tabs, version history and download.",
    category: "generative",
    variants: ["Preview", "Versions"],
    status: "ready",
  },
];

/** The catalog with dated entries first, newest first; the rest keep their order. */
export function newestFirst() {
  return catalog.toSorted((a, b) => (b.added ?? "").localeCompare(a.added ?? ""));
}

/** Released within the last two weeks of the build, so it gets a "New" tag. */
export function isNew(entry: CatalogEntry, now = Date.now()) {
  return !!entry.added && now - Date.parse(entry.added) < 14 * 24 * 60 * 60 * 1000;
}

export function getEntry(slug: string) {
  return catalog.find((entry) => entry.slug === slug);
}

/** Screens are whole app screens made of components; they preview in a device frame. */
export const isScreen = (entry: CatalogEntry) => entry.category === "screens";

export function getCategory(id: CategoryId) {
  return categories.find((category) => category.id === id)!;
}

export function entriesByCategory() {
  return categories.map((category) => ({
    ...category,
    entries: catalog.filter((entry) => entry.category === category.id),
  }));
}

/** Flat order used for prev / next links — follows the sidebar. */
export function orderedEntries() {
  return entriesByCategory().flatMap((group) => group.entries);
}

export function getNeighbors(slug: string) {
  const list = orderedEntries();
  const index = list.findIndex((entry) => entry.slug === slug);
  return { prev: list[index - 1], next: list[index + 1] };
}

export const docsPages = [
  { href: "/components", name: "Introduction" },
  { href: "/docs/installation", name: "Installation" },
] as const;
