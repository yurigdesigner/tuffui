import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { BookingAssistant } from "@/components/booking-assistant";
import { AgentQuestion } from "@/components/ui/agent-question";
import { ConfirmationCard } from "@/components/ui/confirmation-card";
import { SlotPicker } from "@/components/ui/slot-picker";

export function TripPlanner({ trip, run }: { trip: Trip; run: AgentRun }) {
  return (
    <BookingAssistant
      status={run.streaming ? "streaming" : "idle"}
      onSend={(text) => run.send(text)}
      onStop={() => run.stop()}
      data={{
        title: trip.name,
        model: run.model,
        user: { name: trip.owner.name },
        // Each answer can be an interactive component the agent asked for.
        messages: run.turns.map((turn) => ({
          id: turn.id,
          role: turn.role,
          at: turn.createdAt,
          content: renderTurn(turn), // AgentQuestion, SlotPicker, FormCard, ConfirmationCard…
        })),
        summary: {
          title: "Trip summary",
          estimate: trip.estimate,
          items: [
            { id: "venue", label: "Venue", value: trip.venue?.name },
            { id: "call", label: "Kickoff call", value: trip.call?.label },
            { id: "booking", label: "Booking", value: trip.bookingRef },
          ],
        },
      }}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "BookingAssistantData",
      required: true,
      description:
        "Title, model, user, thread messages (any React content) and the summary panel rows. A row with no value shows as not decided yet.",
    },
    {
      name: "status",
      type: '"idle" | "streaming"',
      default: '"idle"',
      description: "While streaming, the composer queues messages and shows Stop.",
    },
    {
      name: "onSend",
      type: "(text: string) => void",
      description: "Called with the composer text.",
    },
    { name: "onStop", type: "() => void", description: "Stops the running answer." },
    {
      name: "summaryOpen",
      type: "boolean",
      description:
        "Controls the side panel (from 64rem wide). Uncontrolled and open by default; below 64rem the same button opens a drawer.",
    },
    {
      name: "onSummaryOpenChange",
      type: "(open: boolean) => void",
      description: "Called when the side panel is shown or hidden.",
    },
    { name: "className", type: "string", description: "Extra classes for the root." },
  ],
  types: `type BookingAssistantData = {
  title: string;
  model: string;
  messages: ThreadMessage[]; // { id, role, at, content: ReactNode }
  summary: { title: string; items: SummaryItem[]; estimate?: string };
  user: { name: string; avatar?: string };
};

type SummaryItem = {
  id: string;
  label: string;
  value?: string; // empty until decided
  icon?: Icon;
};`,
};
