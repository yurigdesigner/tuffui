"use client";

import { useState } from "react";
import { Checkbox, Radio, RadioGroup, Switch } from "@/components/ui/choice-controls";
import { Panel, Shell } from "@/components/ui/surface";

export default function ChoiceControlsDemo({ variant }: { variant?: string }) {
  const [web, setWeb] = useState(true);

  if (variant === "With labels") {
    return (
      <Shell className="max-w-sm">
        <Panel className="flex flex-col gap-4 p-4">
          <Switch
            label="Web search"
            description="Let the agent browse while it answers"
            checked={web}
            onCheckedChange={setWeb}
          />
          <Checkbox label="Remember this choice" defaultChecked />
          <RadioGroup label="Reasoning effort" defaultValue="medium">
            <Radio value="low" label="Low" description="Fastest answers" />
            <Radio value="medium" label="Medium" />
            <Radio value="high" label="High" description="Thinks longer on hard tasks" />
          </RadioGroup>
        </Panel>
      </Shell>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-4">
        <Switch aria-label="Off" />
        <Switch aria-label="On" defaultChecked />
        <Switch aria-label="Disabled" disabled defaultChecked />
      </div>
      <div className="flex items-center gap-4">
        <Checkbox aria-label="Unchecked" />
        <Checkbox aria-label="Checked" defaultChecked />
        <Checkbox aria-label="Mixed" defaultChecked="mixed" />
        <Checkbox aria-label="Disabled" disabled />
      </div>
      <RadioGroup label="Size" defaultValue="m" className="flex-row gap-4">
        <Radio value="s" aria-label="Small" />
        <Radio value="m" aria-label="Medium" />
        <Radio value="l" aria-label="Large" />
      </RadioGroup>
    </div>
  );
}
