// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import { useEffect, useRef, useState } from "react";

/** One beat of a scripted run: wait `delay` ms after the previous step, then apply. */
export type MockStep<S> = { delay: number; apply: (state: S) => S };

/**
 * Plays a scripted sequence of state updates — streaming text, tools starting
 * and finishing, approvals arriving. Only for demos and previews; no component
 * depends on it. Remount (change `key`) or call `replay` to start over.
 */
export function useMockRun<S>(
  initial: S,
  steps: MockStep<S>[],
  { autoplay = true } = {},
) {
  const [state, setState] = useState(initial);
  const [run, setRun] = useState(autoplay ? 1 : 0);
  const [done, setDone] = useState(false);
  const script = useRef({ initial, steps });

  useEffect(() => {
    if (!run) return;
    let at = 0;
    const timers = script.current.steps.map((step) => {
      at += step.delay;
      return setTimeout(() => setState((s) => step.apply(s)), at);
    });
    timers.push(setTimeout(() => setDone(true), at));
    return () => timers.forEach(clearTimeout);
  }, [run]);

  const replay = () => {
    setState(script.current.initial);
    setDone(false);
    setRun((n) => n + 1);
  };

  return { state, setState, done, replay };
}

/** A pause in the script. */
export function wait<S>(delay: number): MockStep<S> {
  return { delay, apply: (s) => s };
}

/**
 * Splits `text` into word-sized tokens and emits one step per token, with a
 * slightly uneven cadence so it reads like a real model stream.
 */
export function streamText<S>(
  text: string,
  apply: (state: S, partial: string) => S,
  { interval = 32, startDelay = 0 } = {},
): MockStep<S>[] {
  const tokens = text.match(/\S+\s*|\s+/g) ?? [];
  let end = 0;
  return tokens.map((token, i) => {
    end += token.length;
    const partial = text.slice(0, end);
    const jitter = ((i * 7919) % 5) * 6;
    return {
      delay: (i === 0 ? startDelay : 0) + interval + jitter,
      apply: (s) => apply(s, partial),
    };
  });
}
