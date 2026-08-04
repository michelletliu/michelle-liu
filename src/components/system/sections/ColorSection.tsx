"use client";

import { useEffect, useRef, useState } from "react";
import { colorGroups, uniformTag, type ColorGroup, type ColorToken, type Tag } from "../tokens";
import { Section, SubLabel, RowList, TagChip } from "../primitives";
import { FilterDropdown } from "../../shared/FilterDropdown";
import { FilterPills } from "../../shared/FilterPills";
import Tooltip from "../../shared/Tooltip";

function ColorSwatch({
  name,
  value,
  className = "h-10 w-10",
}: {
  name: string;
  value: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hex = value.toUpperCase();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard can fail in non-secure contexts; ignore.
    }
  };

  return (
    <Tooltip label={copied ? "Copied" : hex} position="top" forceOpen={copied}>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${name} ${hex}`}
        className={`rounded-lg border border-zinc-100 ${className}`}
        style={{ backgroundColor: value }}
      />
    </Tooltip>
  );
}

type OverviewColor = ColorToken & { groupId: string };

/** Flatten every group (including case-study tabs), de-dupe by hex. First group wins. */
function allUniqueColors(): OverviewColor[] {
  const seen = new Set<string>();
  const result: OverviewColor[] = [];

  for (const group of colorGroups) {
    const colors = [
      ...group.colors,
      ...(group.tabs?.flatMap((tab) => tab.colors) ?? []),
    ];
    for (const c of colors) {
      const key = c.value.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ ...c, groupId: group.id });
    }
  }

  return result;
}

function ColorRow({
  color,
  groupTag,
}: {
  color: ColorToken;
  groupTag?: Tag;
}) {
  return (
    <div className="flex items-center gap-4 py-3.5">
      <div className="w-16 shrink-0">
        <ColorSwatch name={color.name} value={color.value} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          <code className="font-mono text-sm text-zinc-700">{color.name}</code>
          {!groupTag && <TagChip tag={color.tag} />}
        </div>
        <p className="mt-0.5 truncate text-sm text-zinc-400">{color.usage}</p>
      </div>
      <code className="shrink-0 font-mono text-sm uppercase tabular-nums text-zinc-400">
        {color.value}
      </code>
    </div>
  );
}

function CaseStudyColorDetail({ group }: { group: ColorGroup }) {
  const tabs = group.tabs ?? [];
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "");
  const defaultTag = uniformTag(group.colors);
  const activeTabDef = tabs.find((tab) => tab.id === activeTab);
  const activeColors = activeTabDef?.colors ?? [];
  const showDefaults = activeTabDef?.includeDefaults !== false;
  const tabTag = uniformTag(activeColors);

  return (
    <div>
      <SubLabel note={group.note} tag={defaultTag}>
        {group.label}
      </SubLabel>

      {tabs.length > 0 && (
        <>
          <FilterPills
            className="mb-6 -ml-3"
            options={tabs.map((tab) => ({ value: tab.id, label: tab.label }))}
            value={activeTab}
            onChange={setActiveTab}
          />
          <RowList>
            {showDefaults &&
              group.colors.map((c) => (
                <ColorRow key={c.name + c.value} color={c} groupTag={defaultTag} />
              ))}
            {activeColors.map((c) => (
              <ColorRow key={c.name + c.value} color={c} groupTag={tabTag} />
            ))}
          </RowList>
        </>
      )}
    </div>
  );
}

function ColorGroupDetail({ group }: { group: ColorGroup }) {
  if (group.tabs) {
    return <CaseStudyColorDetail group={group} />;
  }

  const groupTag = uniformTag(group.colors);
  return (
    <div>
      <SubLabel note={group.note} tag={groupTag}>
        {group.label}
      </SubLabel>
      <RowList>
        {group.colors.map((c) => (
          <ColorRow key={c.name + c.value} color={c} groupTag={groupTag} />
        ))}
      </RowList>
    </div>
  );
}

const ALL_FILTER_ID = "all";

export default function ColorSection() {
  const overviewColors = allUniqueColors();
  const [activeGroupId, setActiveGroupId] = useState<string>(ALL_FILTER_ID);

  const activeGroup =
    activeGroupId === ALL_FILTER_ID
      ? null
      : (colorGroups.find((group) => group.id === activeGroupId) ?? null);
  const groupOptions = [
    { value: ALL_FILTER_ID, label: "All" },
    ...colorGroups.map((group) => ({
      value: group.id,
      label: group.label,
    })),
  ];

  const toggleFilter = (groupId: string) => {
    setActiveGroupId((current) => {
      if (groupId === ALL_FILTER_ID) return ALL_FILTER_ID;
      return current === groupId ? ALL_FILTER_ID : groupId;
    });
  };

  return (
    <Section id="color" title="Color">
      <FilterDropdown
        className="mb-4 mid:hidden"
        options={groupOptions}
        activeValue={activeGroupId}
        onChange={toggleFilter}
        usePortal
      />
      <div className="mb-4 hidden mid:block">
        <FilterPills
          className="-ml-3"
          options={groupOptions}
          value={activeGroupId}
          pressedValue={activeGroupId}
          onChange={toggleFilter}
        />
      </div>

      <div
        className="mb-16 grid grid-cols-[repeat(auto-fill,32px)] gap-2 mid:grid-cols-[repeat(auto-fill,minmax(44px,1fr))]"
      >
        {overviewColors.map((c) => {
          const dimmed =
            activeGroupId !== ALL_FILTER_ID && c.groupId !== activeGroupId;
          return (
            <ColorSwatch
              key={c.name + c.value}
              name={c.name}
              value={c.value}
              className={`aspect-square w-full transition-opacity duration-200 ease-out ${
                dimmed ? "opacity-10" : "opacity-100"
              }`}
            />
          );
        })}
      </div>

      {activeGroup ? (
        <ColorGroupDetail group={activeGroup} />
      ) : (
        <div className="space-y-24">
          {colorGroups.map((group) => (
            <ColorGroupDetail key={group.id} group={group} />
          ))}
        </div>
      )}
    </Section>
  );
}
