"use client";

import clsx from "clsx";
import { useState, type ReactNode } from "react";
import { ArrowUpRight } from "../../../icons/ArrowUpRight";
import { Chevron } from "../../../icons/Chevron";
import {
  Button,
  type ButtonRadius,
  type ButtonSize,
  type ButtonVariant,
} from "../../../shared/Button";
import { FilterPills } from "../../../shared/FilterPills";
import { ghostIconButtonClass } from "../../../shared/ghostIconButton";
import { iconSize } from "../../../shared/iconSizes";
import LiquidGlassButton from "../../../art/LiquidGlassButton";
import {
  CircleIcon,
  SendIcon,
  SquircleIcon,
} from "../../../library/icons";
import Tooltip from "../../../shared/Tooltip";
import { SubLabel } from "../../primitives";
import {
  SPAN_FULL,
  Specimen,
  SpecimenGrid,
} from "./ComponentSpecimen";

type ButtonContent = "label" | "icon-label" | "icon";
type GlassButtonVariant = Exclude<ButtonVariant, "ghost">;

/** Glass specimens still use Tailwind sizing; solid buttons use CSS `.button`. */
const GLASS_RADIUS_CLASS: Record<ButtonRadius, string> = {
  circular: "rounded-full",
  rectangular: "rounded-xl",
};

const GLASS_TEXT_SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "gap-1 px-3 py-1 text-sm",
  md: "gap-1.5 px-4 py-1.5 text-base",
  lg: "gap-1.5 px-5 py-2.5 text-base",
};

const BUTTON_VARIANTS: ButtonVariant[] = [
  "primary",
  "secondary",
  "tertiary",
  "ghost",
];
const GLASS_BUTTON_VARIANTS: GlassButtonVariant[] = [
  "primary",
  "secondary",
  "tertiary",
];
const BUTTON_SIZES: ButtonSize[] = ["sm", "md", "lg"];

const BUTTON_VARIANT_LABELS: Record<ButtonVariant, string> = {
  primary: "Primary",
  secondary: "Secondary",
  tertiary: "Tertiary",
  ghost: "Ghost",
};

const CONTENT_OPTIONS = [
  { value: "label", label: "Label" },
  { value: "icon-label", label: "Icon + label" },
  { value: "icon", label: "Icon" },
];

function ButtonSample({
  variant,
  size,
  content,
  radius = "circular",
}: {
  variant: ButtonVariant;
  size: ButtonSize;
  content: ButtonContent;
  radius?: ButtonRadius;
}) {
  if (content === "icon") {
    return (
      <Button
        variant={variant}
        size={size}
        icon
        radius={radius}
        aria-label="Send"
        className="button-sample"
      >
        <SendIcon className="-ml-0.5 w-5 pt-0.5" />
      </Button>
    );
  }

  if (content === "icon-label") {
    return (
      <Button
        variant={variant}
        size={size}
        radius={radius}
        className={clsx(
          "button-sample",
          size === "sm" ? "gap-1" : "gap-1.5",
        )}
      >
        <span>Continue</span>
        {variant === "secondary" ? (
          <Chevron direction="right" size={iconSize("sm")} />
        ) : (
          <ArrowUpRight size="12px" />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      radius={radius}
      className="button-sample"
    >
      Label
    </Button>
  );
}

const GLASS_BUTTON_STYLE = {
  backgroundColor: "rgba(255, 255, 255, 0.45)",
  backdropFilter: "blur(16px) saturate(180%)",
  WebkitBackdropFilter: "blur(16px) saturate(180%)",
} as const;

const GLASS_BUTTON_TONE: Record<GlassButtonVariant, string> = {
  primary: "text-blue-500 hover:text-blue-600",
  secondary: "text-zinc-700 hover:text-zinc-900",
  tertiary: "text-zinc-600 hover:text-zinc-800",
};

const GLASS_ICON_SIZE: Record<ButtonSize, number> = {
  sm: 32,
  md: 36,
  lg: 44,
};

function GlassButtonSample({
  variant,
  size,
  content,
  radius = "circular",
}: {
  variant: GlassButtonVariant;
  size: ButtonSize;
  content: ButtonContent;
  radius?: ButtonRadius;
}) {
  const tone = GLASS_BUTTON_TONE[variant];

  if (content === "icon") {
    return (
      <LiquidGlassButton
        size={GLASS_ICON_SIZE[size]}
        radius={radius === "circular" ? "full" : "xl"}
        className={clsx("button-sample", tone)}
        aria-label="Send"
      >
        <SendIcon className="-ml-0.5 w-5 pt-0.5" />
      </LiquidGlassButton>
    );
  }

  return (
    <button
      type="button"
      className={clsx(
        "button-sample inline-flex shrink-0 items-center justify-center border border-white/50 shadow-glass transition-[border-radius,transform] duration-200 ease-in-out motion-reduce:transition-none hover:scale-105",
        GLASS_RADIUS_CLASS[radius],
        GLASS_TEXT_SIZE_CLASS[size],
        variant === "primary"
          ? "font-['Michelle',sans-serif] font-semibold"
          : "font-medium",
        tone,
      )}
      style={GLASS_BUTTON_STYLE}
    >
      {content === "icon-label" ? (
        <>
          <span>Continue</span>
          {variant === "secondary" ? (
            <Chevron direction="right" size={iconSize("sm")} />
          ) : (
            <ArrowUpRight size="12px" />
          )}
        </>
      ) : (
        "Label"
      )}
    </button>
  );
}

function RadiusToggle({
  radius,
  onChange,
  transparent = false,
}: {
  radius: ButtonRadius;
  onChange: (radius: ButtonRadius) => void;
  transparent?: boolean;
}) {
  const isCircular = radius === "circular";
  const label = isCircular ? "View Squircle" : "View Rounded";

  return (
    <div className="button-radius-toggle absolute right-3 top-3 z-[3]">
      <Tooltip label={label} position="bottom">
        <button
          type="button"
          aria-pressed={!isCircular}
          aria-label={label}
          onClick={() => onChange(isCircular ? "rectangular" : "circular")}
          className={clsx(
            ghostIconButtonClass(
              "sm",
              clsx(
                "text-zinc-300",
                !transparent && "bg-white/80 backdrop-blur-sm",
              ),
            ),
            "hover:bg-zinc-100 hover:text-zinc-400",
            "active:bg-zinc-100",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300/60",
          )}
        >
          {isCircular ? (
            <SquircleIcon size={iconSize("md")} />
          ) : (
            <CircleIcon size={iconSize("md")} />
          )}
        </button>
      </Tooltip>
    </div>
  );
}

function ButtonMatrix<V extends ButtonVariant>({
  content,
  variants,
  renderCell,
  caption,
  className,
  radius,
  onRadiusChange,
  transparentToggle = false,
}: {
  content: ButtonContent;
  variants: V[];
  renderCell: (
    variant: V,
    size: ButtonSize,
    content: ButtonContent,
  ) => ReactNode;
  caption: string;
  className: string;
  radius: ButtonRadius;
  onRadiusChange: (radius: ButtonRadius) => void;
  transparentToggle?: boolean;
}) {
  return (
    <div
      className={clsx(
        "button-matrix-stage relative flex min-h-0 flex-1 items-stretch justify-center rounded-xl px-6 py-6 md:items-center",
        className,
      )}
    >
      <RadiusToggle
        radius={radius}
        onChange={onRadiusChange}
        transparent={transparentToggle}
      />
      <p className="sr-only">{caption}</p>

      <div className="button-matrix-mobile flex w-full flex-col gap-5 overflow-y-auto md:hidden">
        {variants.map((variant) => (
          <div
            key={variant}
            className="button-matrix-variant flex flex-col gap-2"
          >
            <span className="text-sm font-normal text-zinc-400">
              {BUTTON_VARIANT_LABELS[variant]}
            </span>
            <div className="grid w-full grid-cols-3 items-end justify-items-center gap-x-2 gap-y-3">
              {BUTTON_SIZES.map((size) => (
                <div
                  key={size}
                  className="button-matrix-size flex w-full flex-col items-center gap-1.5"
                >
                  <span className="text-xs font-normal text-zinc-400">
                    {size}
                  </span>
                  <div className="button-matrix-cell flex h-12 w-full items-center justify-center">
                    {renderCell(variant, size, content)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <table className="button-matrix-table mx-auto hidden w-full max-w-[36rem] table-fixed border-separate border-spacing-x-3 border-spacing-y-4 md:table lg:border-spacing-x-4">
        <caption className="sr-only">{caption}</caption>
        <colgroup>
          <col className="w-[5.5rem]" />
          <col className="w-[9.5rem]" />
          <col className="w-[9.5rem]" />
          <col className="w-[9.5rem]" />
        </colgroup>
        <thead>
          <tr>
            <th className="pb-1 text-left text-sm font-normal text-zinc-400" />
            {BUTTON_SIZES.map((size) => (
              <th
                key={size}
                scope="col"
                className="pb-1 text-center text-sm font-normal text-zinc-400"
              >
                {size}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {variants.map((variant) => (
            <tr key={variant}>
              <th
                scope="row"
                className="text-left text-sm font-normal text-zinc-400"
              >
                {BUTTON_VARIANT_LABELS[variant]}
              </th>
              {BUTTON_SIZES.map((size) => (
                <td key={size} className="text-center align-middle">
                  <div className="button-matrix-cell flex h-12 items-center justify-center">
                    {renderCell(variant, size, content)}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SolidButtonMatrix() {
  const [content, setContent] = useState<ButtonContent>("label");
  const [radius, setRadius] = useState<ButtonRadius>("circular");

  return (
    <div className="solid-button-matrix flex h-full min-h-0 w-full flex-col items-stretch gap-5">
      <ButtonMatrix
        content={content}
        variants={BUTTON_VARIANTS}
        caption="Solid button variants by size"
        className="bg-white"
        radius={radius}
        onRadiusChange={setRadius}
        renderCell={(variant, size, cellContent) => (
          <ButtonSample
            variant={variant}
            size={size}
            content={cellContent}
            radius={radius}
          />
        )}
      />
      <FilterPills
        options={CONTENT_OPTIONS}
        value={content}
        onChange={(value) => setContent(value as ButtonContent)}
        className="shrink-0 justify-center flex-wrap px-6"
      />
    </div>
  );
}

function GlassButtonMatrix() {
  const [content, setContent] = useState<ButtonContent>("label");
  const [radius, setRadius] = useState<ButtonRadius>("circular");

  return (
    <div className="glass-button-matrix flex h-full min-h-0 w-full flex-col items-stretch gap-5">
      <ButtonMatrix
        content={content}
        variants={GLASS_BUTTON_VARIANTS}
        caption="Glass button variants by size"
        className="bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-300"
        radius={radius}
        onRadiusChange={setRadius}
        transparentToggle
        renderCell={(variant, size, cellContent) => (
          <GlassButtonSample
            variant={variant}
            size={size}
            content={cellContent}
            radius={radius}
          />
        )}
      />
      <FilterPills
        options={CONTENT_OPTIONS}
        value={content}
        onChange={(value) => setContent(value as ButtonContent)}
        className="shrink-0 justify-center flex-wrap px-6"
      />
    </div>
  );
}

const VARIANT_OPTIONS = [
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "tertiary", label: "Tertiary" },
  { value: "ghost", label: "Ghost" },
];
const GLASS_VARIANT_OPTIONS = VARIANT_OPTIONS.filter(
  (option) => option.value !== "ghost",
);
const SIZE_OPTIONS = [
  { value: "sm", label: "sm" },
  { value: "md", label: "md" },
  { value: "lg", label: "lg" },
];
const SURFACE_OPTIONS = [
  { value: "solid", label: "Solid" },
  { value: "glass", label: "Glass" },
];

function PlaygroundSetting({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="button-playground-setting grid w-full grid-cols-1 items-center gap-1.5 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-3">
      <span className="text-sm text-zinc-400">{label}</span>
      <div className="flex min-w-0 justify-start">{children}</div>
    </div>
  );
}

function ButtonPlayground() {
  const [variant, setVariant] = useState<ButtonVariant>("primary");
  const [size, setSize] = useState<ButtonSize>("md");
  const [content, setContent] = useState<ButtonContent>("label");
  const [surface, setSurface] = useState<"solid" | "glass">("solid");
  const [radius, setRadius] = useState<ButtonRadius>("circular");
  const isGlass = surface === "glass";

  const handleSurfaceChange = (value: string) => {
    const nextSurface = value as "solid" | "glass";
    setSurface(nextSurface);
    if (nextSurface === "glass" && variant === "ghost") {
      setVariant("tertiary");
    }
  };

  return (
    <div className="button-playground flex h-full w-full min-h-0 flex-col items-stretch gap-6">
      <div
        className={clsx(
          "button-playground-stage relative flex h-36 shrink-0 items-center justify-center rounded-xl px-6 sm:h-44",
          isGlass
            ? "bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-300"
            : "bg-white",
        )}
      >
        <RadiusToggle
          radius={radius}
          onChange={setRadius}
          transparent={isGlass}
        />
        {isGlass && variant !== "ghost" ? (
          <GlassButtonSample
            variant={variant}
            size={size}
            content={content}
            radius={radius}
          />
        ) : (
          <ButtonSample
            variant={variant}
            size={size}
            content={content}
            radius={radius}
          />
        )}
      </div>

      <div
        className="button-playground-settings flex w-full shrink-0 flex-col gap-2.5 px-6"
        role="group"
        aria-label="Button playground settings"
      >
        <PlaygroundSetting label="Surface">
          <FilterPills
            options={SURFACE_OPTIONS}
            value={surface}
            onChange={handleSurfaceChange}
            className="flex-wrap"
          />
        </PlaygroundSetting>
        <PlaygroundSetting label="Variant">
          <FilterPills
            options={isGlass ? GLASS_VARIANT_OPTIONS : VARIANT_OPTIONS}
            value={variant}
            onChange={(value) => setVariant(value as ButtonVariant)}
            className="flex-wrap"
          />
        </PlaygroundSetting>
        <PlaygroundSetting label="Size">
          <FilterPills
            options={SIZE_OPTIONS}
            value={size}
            onChange={(value) => setSize(value as ButtonSize)}
            className="flex-wrap"
          />
        </PlaygroundSetting>
        <PlaygroundSetting label="Content">
          <FilterPills
            options={CONTENT_OPTIONS}
            value={content}
            onChange={(value) => setContent(value as ButtonContent)}
            className="flex-wrap"
          />
        </PlaygroundSetting>
      </div>
    </div>
  );
}

const MATRIX_CARD_CLASS =
  "!h-[36rem] !min-h-[36rem] !max-h-[36rem] !items-stretch !justify-start overflow-hidden md:!h-[30rem] md:!min-h-[30rem] md:!max-h-[30rem]";

export function ButtonSpecimens() {
  return (
    <>
      <SubLabel>Buttons</SubLabel>
      <SpecimenGrid>
        <Specimen
          label="Solid"
          span={SPAN_FULL}
          className={MATRIX_CARD_CLASS}
          labelPosition="top"
        >
          <SolidButtonMatrix />
        </Specimen>
        <Specimen
          label="Glass"
          span={SPAN_FULL}
          className={MATRIX_CARD_CLASS}
          labelPosition="top"
        >
          <GlassButtonMatrix />
        </Specimen>
        <Specimen
          label="Playground"
          span={SPAN_FULL}
          className="!items-stretch !justify-start"
          labelPosition="top"
        >
          <ButtonPlayground />
        </Specimen>
      </SpecimenGrid>
    </>
  );
}
