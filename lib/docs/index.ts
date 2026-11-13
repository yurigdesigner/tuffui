import { docs as surface } from "@/registry/surface/docs";
import { docs as actionButton } from "@/registry/action-button/docs";
import { docs as choiceControls } from "@/registry/choice-controls/docs";
import { docs as statusPill } from "@/registry/status-pill/docs";
import { docs as segmentedControl } from "@/registry/segmented-control/docs";
import { docs as progressBar } from "@/registry/progress-bar/docs";
import { docs as rollingNumber } from "@/registry/rolling-number/docs";
import { docs as textField } from "@/registry/text-field/docs";
import { docs as tooltipHint } from "@/registry/tooltip-hint/docs";
import { docs as streamingMessage } from "@/registry/streaming-message/docs";
import { docs as agentComposer } from "@/registry/agent-composer/docs";
import { docs as toolApprovalQueue } from "@/registry/tool-approval-queue/docs";
import { docs as toolCallBlock } from "@/registry/tool-call-block/docs";
import { docs as backgroundAgents } from "@/registry/background-agents/docs";
import { docs as runTrace } from "@/registry/run-trace/docs";
import { docs as contextWindowMeter } from "@/registry/context-window-meter/docs";
import { docs as agentQuestion } from "@/registry/agent-question/docs";
import { docs as agentStatus } from "@/registry/agent-status/docs";
import { docs as fileChanges } from "@/registry/file-changes/docs";
import { docs as terminalOutput } from "@/registry/terminal-output/docs";
import { docs as memoryPanel } from "@/registry/memory-panel/docs";
import { docs as usageSummary } from "@/registry/usage-summary/docs";
import { docs as messageBranches } from "@/registry/message-branches/docs";
import { docs as responseFeedback } from "@/registry/response-feedback/docs";
import { docs as mcpServers } from "@/registry/mcp-servers/docs";
import { docs as checkpointTimeline } from "@/registry/checkpoint-timeline/docs";
import { docs as evalResults } from "@/registry/eval-results/docs";
import { docs as rateLimits } from "@/registry/rate-limits/docs";
import { docs as chatThread } from "@/registry/chat-thread/docs";
import { docs as userMessage } from "@/registry/user-message/docs";
import { docs as conversationList } from "@/registry/conversation-list/docs";
import { docs as promptSuggestions } from "@/registry/prompt-suggestions/docs";
import { docs as attachmentPreview } from "@/registry/attachment-preview/docs";
import { docs as codeBlock } from "@/registry/code-block/docs";
import { docs as sourceList } from "@/registry/source-list/docs";
import { docs as chartCard } from "@/registry/chart-card/docs";
import { docs as dotHistogram } from "@/registry/dot-histogram/docs";
import { docs as tickGauge } from "@/registry/tick-gauge/docs";
import { docs as mirrorStrips } from "@/registry/mirror-strips/docs";
import { docs as radialDots } from "@/registry/radial-dots/docs";
import { docs as matchField } from "@/registry/match-field/docs";
import { docs as radarChart } from "@/registry/radar-chart/docs";
import { docs as lapTimer } from "@/registry/lap-timer/docs";
import { docs as evalRace } from "@/registry/eval-race/docs";
import { docs as toolCallGraph } from "@/registry/tool-call-graph/docs";
import { docs as deployTimeline } from "@/registry/deploy-timeline/docs";
import { docs as deliveryHeatmap } from "@/registry/delivery-heatmap/docs";
import { docs as clausePlaybook } from "@/registry/clause-playbook/docs";
import { docs as toneRewrite } from "@/registry/tone-rewrite/docs";
import { docs as inboxCleanup } from "@/registry/inbox-cleanup/docs";
import { docs as renewalRings } from "@/registry/renewal-rings/docs";
import { docs as messageLog } from "@/registry/message-log/docs";
import { docs as divergingBars } from "@/registry/diverging-bars/docs";
import { docs as blastRadius } from "@/registry/blast-radius/docs";
import { docs as isoBars } from "@/registry/iso-bars/docs";
import { docs as hexDensity } from "@/registry/hex-density/docs";
import { docs as dataTable } from "@/registry/data-table/docs";
import { docs as statGrid } from "@/registry/stat-grid/docs";
import { docs as formCard } from "@/registry/form-card/docs";
import { docs as resultCarousel } from "@/registry/result-carousel/docs";
import { docs as slotPicker } from "@/registry/slot-picker/docs";
import { docs as confirmationCard } from "@/registry/confirmation-card/docs";
import { docs as jsonViewer } from "@/registry/json-viewer/docs";
import { docs as artifactPanel } from "@/registry/artifact-panel/docs";
import { docs as actionMenu } from "@/registry/action-menu/docs";
import { docs as popoverPanel } from "@/registry/popover-panel/docs";
import { docs as modalSheet } from "@/registry/modal-sheet/docs";
import { docs as toastStack } from "@/registry/toast-stack/docs";
import { docs as selectField } from "@/registry/select-field/docs";
import { docs as tabPanels } from "@/registry/tab-panels/docs";
import { docs as disclosure } from "@/registry/disclosure/docs";
import { docs as agentAvatar } from "@/registry/agent-avatar/docs";
import { docs as loadingSkeleton } from "@/registry/loading-skeleton/docs";
import { docs as rangeSlider } from "@/registry/range-slider/docs";
import { docs as keyHint } from "@/registry/key-hint/docs";
import { docs as loader } from "@/registry/loader/docs";
import { docs as emptyState } from "@/registry/empty-state/docs";
import { docs as dateField } from "@/registry/date-field/docs";
import { docs as dropZone } from "@/registry/drop-zone/docs";
import { docs as aiChat } from "@/registry/ai-chat/docs";
import { docs as codingAgent } from "@/registry/coding-agent/docs";
import { docs as dataAnswer } from "@/registry/data-answer/docs";
import { docs as bookingAssistant } from "@/registry/booking-assistant/docs";
import { docs as agentConsole } from "@/registry/agent-console/docs";
import { docs as supportWidget } from "@/registry/support-widget/docs";
import { docs as handoffInbox } from "@/registry/handoff-inbox/docs";
import type { ComponentDocs } from "./types";

export const componentDocs: Record<string, ComponentDocs> = {
  surface: surface,
  "action-button": actionButton,
  "choice-controls": choiceControls,
  "status-pill": statusPill,
  "segmented-control": segmentedControl,
  "progress-bar": progressBar,
  "rolling-number": rollingNumber,
  "text-field": textField,
  "tooltip-hint": tooltipHint,
  "streaming-message": streamingMessage,
  "agent-composer": agentComposer,
  "tool-approval-queue": toolApprovalQueue,
  "tool-call-block": toolCallBlock,
  "background-agents": backgroundAgents,
  "run-trace": runTrace,
  "context-window-meter": contextWindowMeter,
  "agent-question": agentQuestion,
  "agent-status": agentStatus,
  "file-changes": fileChanges,
  "terminal-output": terminalOutput,
  "memory-panel": memoryPanel,
  "usage-summary": usageSummary,
  "message-branches": messageBranches,
  "response-feedback": responseFeedback,
  "mcp-servers": mcpServers,
  "checkpoint-timeline": checkpointTimeline,
  "eval-results": evalResults,
  "rate-limits": rateLimits,
  "chat-thread": chatThread,
  "user-message": userMessage,
  "conversation-list": conversationList,
  "prompt-suggestions": promptSuggestions,
  "attachment-preview": attachmentPreview,
  "code-block": codeBlock,
  "source-list": sourceList,
  "chart-card": chartCard,
  "dot-histogram": dotHistogram,
  "tick-gauge": tickGauge,
  "mirror-strips": mirrorStrips,
  "radial-dots": radialDots,
  "match-field": matchField,
  "radar-chart": radarChart,
  "lap-timer": lapTimer,
  "eval-race": evalRace,
  "tool-call-graph": toolCallGraph,
  "deploy-timeline": deployTimeline,
  "delivery-heatmap": deliveryHeatmap,
  "clause-playbook": clausePlaybook,
  "tone-rewrite": toneRewrite,
  "inbox-cleanup": inboxCleanup,
  "renewal-rings": renewalRings,
  "message-log": messageLog,
  "diverging-bars": divergingBars,
  "blast-radius": blastRadius,
  "iso-bars": isoBars,
  "hex-density": hexDensity,
  "data-table": dataTable,
  "stat-grid": statGrid,
  "form-card": formCard,
  "result-carousel": resultCarousel,
  "slot-picker": slotPicker,
  "confirmation-card": confirmationCard,
  "json-viewer": jsonViewer,
  "artifact-panel": artifactPanel,
  "action-menu": actionMenu,
  "popover-panel": popoverPanel,
  "modal-sheet": modalSheet,
  "toast-stack": toastStack,
  "select-field": selectField,
  "tab-panels": tabPanels,
  disclosure: disclosure,
  "agent-avatar": agentAvatar,
  "loading-skeleton": loadingSkeleton,
  "range-slider": rangeSlider,
  "key-hint": keyHint,
  loader: loader,
  "empty-state": emptyState,
  "date-field": dateField,
  "drop-zone": dropZone,
  "ai-chat": aiChat,
  "coding-agent": codingAgent,
  "data-answer": dataAnswer,
  "booking-assistant": bookingAssistant,
  "agent-console": agentConsole,
  "support-widget": supportWidget,
  "handoff-inbox": handoffInbox,
};
