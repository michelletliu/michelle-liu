"use client";

import clsx from "clsx";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { ArrowRightIcon } from "../../../icons/Arrow";
import {
  FieldInput,
  FieldLeadingIcon,
  FieldShell,
  FieldTrailingIcon,
  SearchMagnifierIcon,
} from "../../../shared/FieldInput";
import { iconSize } from "../../../shared/iconSizes";
import { getHorizontalFadeVisibility } from "../../inputMatrixScroll";
import { SubLabel } from "../../primitives";
import {
  SPAN_FULL,
  Specimen,
  SpecimenGrid,
} from "./ComponentSpecimen";

type InputComposition = "text" | "leading" | "trailing" | "muted";
type InputState = "default" | "focus" | "filled" | "disabled" | "error";

const INPUT_COMPOSITIONS: InputComposition[] = [
  "text",
  "leading",
  "trailing",
  "muted",
];
const INPUT_STATES: InputState[] = [
  "default",
  "focus",
  "filled",
  "disabled",
  "error",
];

const COMPOSITION_LABELS: Record<InputComposition, string> = {
  text: "Text",
  leading: "Leading icon",
  trailing: "Trailing icon",
  muted: "Muted",
};

const STATE_LABELS: Record<InputState, string> = {
  default: "Default",
  focus: "Focus",
  filled: "Filled",
  disabled: "Disabled",
  error: "Error",
};

function InputSample({
  composition,
  state,
}: {
  composition: InputComposition;
  state: InputState;
}) {
  const isDisabled = state === "disabled";
  const isError = state === "error";
  const isFocus = state === "focus";
  const showValue = state === "filled" || state === "error";

  const shellTone = composition === "muted" ? "muted" : "surface";
  const shellComposition =
    composition === "leading" || composition === "trailing"
      ? composition
      : null;

  const placeholder =
    composition === "leading"
      ? "Filter"
      : composition === "trailing"
        ? "Enter"
        : composition === "muted"
          ? "Say Hi"
          : "Book Title";

  const filledValue =
    composition === "trailing"
      ? "••••"
      : composition === "leading"
        ? "Books"
        : "Michelle";

  return (
    <FieldShell
      tone={shellTone}
      active={isFocus}
      error={isError}
      className={clsx("input-sample rounded-full", shellComposition)}
    >
      {composition === "leading" ? (
        <FieldLeadingIcon>
          {/* Specimen-only — gallery keeps its own `size="15px"` on MetArtworkPicker. */}
          <SearchMagnifierIcon size={iconSize("xs")} />
        </FieldLeadingIcon>
      ) : null}
      <FieldInput
        type={composition === "trailing" ? "password" : "text"}
        inputMode={composition === "leading" ? "search" : undefined}
        placeholder={placeholder}
        defaultValue={showValue ? filledValue : ""}
        disabled={isDisabled}
        readOnly={isFocus || isError}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label={`${COMPOSITION_LABELS[composition]} · ${STATE_LABELS[state]}`}
      />
      {composition === "trailing" ? (
        <FieldTrailingIcon className="field-trailing-icon">
          <ArrowRightIcon size={iconSize("sm")} />
        </FieldTrailingIcon>
      ) : null}
    </FieldShell>
  );
}

function InputMatrix() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [fadeVisibility, setFadeVisibility] = useState({
    showLeft: false,
    showRight: true,
  });

  const updateFadeVisibility = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const next = getHorizontalFadeVisibility(scroller);
    setFadeVisibility((current) =>
      current.showLeft === next.showLeft &&
      current.showRight === next.showRight
        ? current
        : next,
    );
  }, []);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    updateFadeVisibility();
    const observer = new ResizeObserver(updateFadeVisibility);
    observer.observe(scroller);
    if (scroller.firstElementChild) {
      observer.observe(scroller.firstElementChild);
    }
    return () => observer.disconnect();
  }, [updateFadeVisibility]);

  return (
    <div className="input-matrix relative flex h-full w-full min-w-0 flex-col items-stretch">
      <div className="input-matrix-stage flex min-h-0 min-w-0 flex-1 items-stretch justify-center overflow-hidden px-0 py-6 md:items-center">
        <p className="sr-only">Field compositions by interaction state</p>

        <div className="input-matrix-mobile flex w-full flex-col gap-5 md:hidden">
          {INPUT_COMPOSITIONS.map((composition) => (
            <div
              key={composition}
              className="input-matrix-composition flex flex-col gap-2"
            >
              <span className="text-sm font-normal text-zinc-400">
                {COMPOSITION_LABELS[composition]}
              </span>
              <div className="flex flex-wrap items-end justify-center gap-x-4 gap-y-3">
                {INPUT_STATES.map((state) => (
                  <div
                    key={state}
                    className="input-matrix-state flex flex-col items-center gap-1.5"
                  >
                    <span className="text-xs font-normal text-zinc-400">
                      {STATE_LABELS[state]}
                    </span>
                    <div className="input-matrix-cell flex min-h-12 w-[11.5rem] items-center justify-center">
                      <InputSample composition={composition} state={state} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="input-matrix-desktop relative hidden w-full min-w-0 md:grid md:grid-cols-[7.5rem_minmax(0,1fr)] md:gap-x-3 lg:gap-x-4">
          <div className="relative z-20 grid grid-rows-[1.5rem_repeat(4,3rem)] gap-y-4 bg-zinc-50">
            <div aria-hidden />
            {INPUT_COMPOSITIONS.map((composition) => (
              <div
                key={composition}
                className="input-matrix-composition flex h-12 items-center text-left text-sm font-normal text-zinc-400"
              >
                {COMPOSITION_LABELS[composition]}
              </div>
            ))}
          </div>

          <div className="relative min-w-0">
            <div
              ref={scrollerRef}
              onScroll={updateFadeVisibility}
              className="input-matrix-scroller h-full min-w-0 overflow-x-auto"
            >
              <div className="grid w-max grid-cols-[repeat(5,12.5rem)] grid-rows-[1.5rem_repeat(4,3rem)] gap-x-3 gap-y-4 lg:gap-x-4">
                {INPUT_STATES.map((state) => (
                  <div
                    key={state}
                    className="input-matrix-state flex items-start justify-center pb-1 text-center text-sm font-normal text-zinc-400"
                  >
                    {STATE_LABELS[state]}
                  </div>
                ))}
                {INPUT_COMPOSITIONS.flatMap((composition) =>
                  INPUT_STATES.map((state) => (
                    <div
                      key={`${composition}-${state}`}
                      className="input-matrix-cell flex h-12 items-center justify-center"
                    >
                      <InputSample composition={composition} state={state} />
                    </div>
                  )),
                )}
              </div>
            </div>

            <div
              aria-hidden
              className={clsx(
                "pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-zinc-50 to-transparent transition-opacity duration-150 ease-out motion-reduce:transition-none",
                fadeVisibility.showLeft ? "opacity-100" : "opacity-0",
              )}
            />
            <div
              aria-hidden
              className={clsx(
                "pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-zinc-50 to-transparent transition-opacity duration-150 ease-out motion-reduce:transition-none",
                fadeVisibility.showRight ? "opacity-100" : "opacity-0",
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function InputSpecimens() {
  return (
    <>
      <SubLabel>Inputs</SubLabel>
      <SpecimenGrid>
        <Specimen
          span={SPAN_FULL}
          className="relative min-h-0 !items-stretch !justify-start overflow-hidden"
          labelPosition="top"
        >
          <InputMatrix />
        </Specimen>
      </SpecimenGrid>
    </>
  );
}
