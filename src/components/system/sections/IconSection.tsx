"use client";

import type { ReactNode } from "react";
import { ArrowUpRight } from "../../ArrowUpRight";
import { LinkIcon } from "../../LinkIcon";
import { TouchIcon } from "../../TouchIcon";
import { ChevronLeftIcon, ChevronRightIcon } from "../../art/ChevronIcons";
import {
  ArrowRightIcon,
  ChevronDownIcon,
  CloseIcon,
  PlusIcon,
  SendIcon,
  SmileyIcon,
} from "../../library/icons";
import { SocialLinksBackgroundImage } from "../../SocialLinks";
import svgPaths from "../../../imports/svg-2tsxp86msm";
import LumaLogo from "../../../assets/LumaLogo.svg";
import { Section, SubLabel, Grid } from "../primitives";

const X_LOGO_PATH =
  "M10.6862 7.6055L17.3844 0H15.8002L9.97941 6.60311L5.36277 0H0.178833L7.19548 9.9737L0.178833 17.9454H1.76308L7.90171 10.9761L12.7696 17.9454H17.9536L10.6858 7.6055H10.6862ZM8.7057 10.0639L7.99222 9.06869L2.33673 1.16544H4.60063L9.33802 7.5516L10.0515 8.54678L15.8011 16.8348H13.5372L8.7057 10.0643V10.0639Z";

/** Filled info glyph from InfoButton / ExperimentModal. */
function InfoIcon() {
  return (
    <svg className="size-5" viewBox="0 0 25 25" fill="none" aria-hidden>
      <path
        d="M12.4512 24.9023C10.734 24.9023 9.12272 24.5768 7.61719 23.9258C6.11165 23.2829 4.78923 22.3918 3.6499 21.2524C2.51058 20.1131 1.6154 18.7907 0.964355 17.2852C0.321452 15.7796 0 14.1683 0 12.4512C0 10.734 0.321452 9.12272 0.964355 7.61719C1.6154 6.11165 2.51058 4.78923 3.6499 3.6499C4.78923 2.50244 6.11165 1.60726 7.61719 0.964355C9.12272 0.321452 10.734 0 12.4512 0C14.1683 0 15.7796 0.321452 17.2852 0.964355C18.7907 1.60726 20.1131 2.50244 21.2524 3.6499C22.3918 4.78923 23.2829 6.11165 23.9258 7.61719C24.5768 9.12272 24.9023 10.734 24.9023 12.4512C24.9023 14.1683 24.5768 15.7796 23.9258 17.2852C23.2829 18.7907 22.3918 20.1131 21.2524 21.2524C20.1131 22.3918 18.7907 23.2829 17.2852 23.9258C15.7796 24.5768 14.1683 24.9023 12.4512 24.9023ZM12.4512 22.8271C13.8835 22.8271 15.2262 22.5586 16.4795 22.0215C17.7327 21.4844 18.8354 20.7397 19.7876 19.7876C20.7397 18.8354 21.4844 17.7327 22.0215 16.4795C22.5586 15.2262 22.8271 13.8835 22.8271 12.4512C22.8271 11.0189 22.5586 9.67611 22.0215 8.42285C21.4844 7.16146 20.7397 6.05876 19.7876 5.11475C18.8354 4.1626 17.7327 3.41797 16.4795 2.88086C15.2262 2.34375 13.8835 2.0752 12.4512 2.0752C11.0189 2.0752 9.67611 2.34375 8.42285 2.88086C7.1696 3.41797 6.06689 4.1626 5.11475 5.11475C4.1626 6.05876 3.41797 7.16146 2.88086 8.42285C2.34375 9.67611 2.0752 11.0189 2.0752 12.4512C2.0752 13.8835 2.34375 15.2262 2.88086 16.4795C3.41797 17.7327 4.1626 18.8354 5.11475 19.7876C6.06689 20.7397 7.1696 21.4844 8.42285 22.0215C9.67611 22.5586 11.0189 22.8271 12.4512 22.8271ZM10.3149 19.2749C10.0627 19.2749 9.85107 19.1935 9.68018 19.0308C9.50928 18.868 9.42383 18.6646 9.42383 18.4204C9.42383 18.1763 9.50928 17.9728 9.68018 17.8101C9.85107 17.6473 10.0627 17.5659 10.3149 17.5659H11.8286V11.9629H10.5225C10.2702 11.9629 10.0586 11.8815 9.8877 11.7188C9.7168 11.556 9.63135 11.3525 9.63135 11.1084C9.63135 10.8643 9.7168 10.6608 9.8877 10.498C10.0586 10.3353 10.2702 10.2539 10.5225 10.2539H12.8174C13.1266 10.2539 13.3626 10.3556 13.5254 10.5591C13.6882 10.7544 13.7695 11.0189 13.7695 11.3525V17.5659H15.2832C15.5355 17.5659 15.7471 17.6473 15.918 17.8101C16.0889 17.9728 16.1743 18.1763 16.1743 18.4204C16.1743 18.6646 16.0889 18.868 15.918 19.0308C15.7471 19.1935 15.5355 19.2749 15.2832 19.2749H10.3149ZM12.3413 8.21533C11.9019 8.21533 11.5275 8.06071 11.2183 7.75146C10.909 7.44222 10.7544 7.06787 10.7544 6.62842C10.7544 6.18083 10.909 5.80241 11.2183 5.49316C11.5275 5.18392 11.9019 5.0293 12.3413 5.0293C12.7889 5.0293 13.1632 5.18392 13.4644 5.49316C13.7736 5.80241 13.9282 6.18083 13.9282 6.62842C13.9282 7.06787 13.7736 7.44222 13.4644 7.75146C13.1632 8.06071 12.7889 8.21533 12.3413 8.21533Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Expand corners from ExperimentModal / Expand.svg. */
function ExpandIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M10 4H4V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 4L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 20H20V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 20L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Thin filter / pop-up chevron (FilterDropdown, system mobile menu). */
function FilterChevronIcon() {
  return (
    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

/** Breadcrumb separator (ProjectModal / ExperimentModal). */
function BreadcrumbChevronIcon() {
  return (
    <svg className="size-5" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M6 12L10 8L6 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Password submit arrow (ProtectedContent / ProjectModal). */
function SubmitDownArrowIcon() {
  return (
    <svg className="h-5 w-4" viewBox="0 0 12 14" fill="none" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6 0C6.41421 0 6.75 0.335786 6.75 0.75V11.4393L10.7197 7.46967C11.0126 7.17678 11.4874 7.17678 11.7803 7.46967C12.0732 7.76256 12.0732 8.23744 11.7803 8.53033L6.53033 13.7803C6.23744 14.0732 5.76256 14.0732 5.46967 13.7803L0.21967 8.53033C-0.0732233 8.23744 -0.0732233 7.76256 0.21967 7.46967C0.512563 7.17678 0.987437 7.17678 1.28033 7.46967L5.25 11.4393V0.75C5.25 0.335786 5.58579 0 6 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5.25C4.5 5.25 1.5 12 1.5 12C1.5 12 4.5 18.75 12 18.75C19.5 18.75 22.5 12 22.5 12C22.5 12 19.5 5.25 12 5.25Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 15.75C14.0711 15.75 15.75 14.0711 15.75 12C15.75 9.92893 14.0711 8.25 12 8.25C9.92893 8.25 8.25 9.92893 8.25 12C8.25 14.0711 9.92893 15.75 12 15.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14.12 14.12C13.5646 14.6755 12.7998 14.9855 12 14.9855C11.2002 14.9855 10.4354 14.6755 9.88 14.12C9.32457 13.5646 9.0145 12.7998 9.0145 12C9.0145 11.2002 9.32457 10.4354 9.88 9.88"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4.5 4.5L19.5 19.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M9.75 5.5C10.485 5.34 11.235 5.25 12 5.25C19.5 5.25 22.5 12 22.5 12C22.02 12.945 21.42 13.815 20.73 14.61"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.94 17.94C16.23 19.17 14.16 19.875 12 19.875C4.5 19.875 1.5 13.125 1.5 13.125C2.505 11.205 3.975 9.54 5.775 8.355"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg className="size-5" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <circle cx="8" cy="8" r="3.5" />
      <line x1="8" y1="0.5" x2="8" y2="2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="13.5" x2="8" y2="15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15.5" y1="8" x2="13.5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="2.5" y1="8" x2="0.5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13.3" y1="2.7" x2="11.89" y2="4.11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4.11" y1="11.89" x2="2.7" y2="13.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13.3" y1="13.3" x2="11.89" y2="11.89" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4.11" y1="4.11" x2="2.7" y2="2.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="size-5" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M14 9.27A6.5 6.5 0 1 1 6.73 2 5.5 5.5 0 0 0 14 9.27Z" />
    </svg>
  );
}

/** Lucide check used by shadcn checkbox / menus. */
function CheckIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-7 w-auto" viewBox="0 0 19 28" fill="none" aria-hidden>
      <path
        d="M3.13274 27.3175C2.1117 27.3175 1.33199 27.039 0.793626 26.4821C0.264542 25.9251 0 25.099 0 24.0037V14.4106C0 13.3153 0.264542 12.4938 0.793626 11.9462C1.33199 11.3892 2.1117 11.1108 3.13274 11.1108H15.8725C16.8936 11.1108 17.6686 11.3892 18.1977 11.9462C18.7361 12.4938 19.0053 13.3153 19.0053 14.4106V24.0037C19.0053 25.099 18.7361 25.9251 18.1977 26.4821C17.6686 27.039 16.8936 27.3175 15.8725 27.3175H3.13274ZM2.43657 12.1829V7.78311C2.43657 6.03806 2.77073 4.59004 3.43905 3.43905C4.11665 2.28806 4.99381 1.42946 6.07054 0.863242C7.14728 0.287747 8.28899 0 9.49567 0C10.7116 0 11.858 0.287747 12.9347 0.863242C14.0114 1.42946 14.884 2.28806 15.5523 3.43905C16.2299 4.59004 16.5687 6.03806 16.5687 7.78311V12.1829H14.3688V7.47679C14.3688 6.30724 14.1414 5.32333 13.6866 4.52506C13.241 3.72679 12.647 3.12345 11.9044 2.71504C11.1711 2.30662 10.3682 2.10241 9.49567 2.10241C8.63243 2.10241 7.82952 2.30662 7.08694 2.71504C6.35365 3.12345 5.76423 3.72679 5.31869 4.52506C4.87314 5.32333 4.65037 6.30724 4.65037 7.47679V12.1829H2.43657Z"
        fill="currentColor"
      />
    </svg>
  );
}

type IconSpecimen = {
  name: string;
  usage: string;
  source?: string;
  sample: ReactNode;
};

function IconCard({ name, usage, source, sample }: IconSpecimen) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex h-24 items-center justify-center overflow-hidden rounded-xl bg-zinc-50 text-zinc-500">
        {sample}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-base font-medium text-zinc-700">{name}</span>
        {source && (
          <code className="block break-words font-mono text-sm leading-relaxed text-zinc-400">{source}</code>
        )}
        <span className="text-sm leading-snug text-zinc-400 text-pretty">{usage}</span>
      </div>
    </div>
  );
}

const uiIcons: IconSpecimen[] = [
  {
    name: "ArrowUpRight",
    source: "ArrowUpRight.tsx",
    usage: "External / meta links, CTAs, email hover",
    sample: <ArrowUpRight size="20px" />,
  },
  {
    name: "Chevron left / right",
    source: "art/ChevronIcons.tsx",
    usage: "Art mural & sketchbook carousel arrows",
    sample: (
      <div className="flex items-center gap-4">
        <ChevronLeftIcon className="size-5" />
        <ChevronRightIcon className="size-5" />
      </div>
    ),
  },
  {
    name: "Chevron down",
    source: "library/icons.tsx",
    usage: "Library / shelf filter trigger",
    sample: <ChevronDownIcon className="h-2.5 w-4" />,
  },
  {
    name: "Filter chevron",
    source: "FilterDropdown / SystemPage",
    usage: "Filter pills & mobile section menu",
    sample: <FilterChevronIcon />,
  },
  {
    name: "Breadcrumb chevron",
    source: "ProjectModal / ExperimentModal",
    usage: "Modal breadcrumb separators",
    sample: <BreadcrumbChevronIcon />,
  },
  {
    name: "Plus",
    source: "library/icons.tsx · PlusIcon",
    usage: "Add book / create actions",
    sample: <PlusIcon className="size-5" />,
  },
  {
    name: "Close",
    source: "library/icons.tsx · CloseIcon",
    usage: "Library / book modals",
    sample: <CloseIcon className="size-5" />,
  },
  {
    name: "Modal close",
    source: "ProjectModal / lightbox",
    usage: "Centered modal & lightbox dismiss",
    sample: (
      <svg className="size-5" viewBox="0 0 24 24" fill="none" aria-hidden>
        <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Info",
    source: "InfoButton / ExperimentModal",
    usage: "Project & experiment info triggers",
    sample: <InfoIcon />,
  },
  {
    name: "Expand",
    source: "Expand.svg / ExperimentModal",
    usage: "Open experiment / project full page",
    sample: <ExpandIcon />,
  },
  {
    name: "Send",
    source: "library/icons.tsx · SendIcon",
    usage: "Library add-book submit",
    sample: <SendIcon className="size-5" />,
  },
  {
    name: "Smiley",
    source: "library/icons.tsx · SmileyIcon",
    usage: "Library success state",
    sample: <SmileyIcon className="size-5" />,
  },
  {
    name: "Arrow right",
    source: "library/icons.tsx · ArrowRightIcon",
    usage: "Flat horizontal arrow (library)",
    sample: <ArrowRightIcon className="size-5" />,
  },
  {
    name: "Submit down arrow",
    source: "ProtectedContent / ProjectModal",
    usage: "Password field submit",
    sample: <SubmitDownArrowIcon />,
  },
  {
    name: "Link",
    source: "LinkIcon.tsx",
    usage: "External experiment links on home",
    sample: <LinkIcon size="20px" />,
  },
  {
    name: "Touch",
    source: "TouchIcon.tsx",
    usage: "Interactive / in-site experiment links",
    sample: <TouchIcon size="20px" />,
  },
  {
    name: "Lock",
    source: "assets/lock.svg",
    usage: "Password-gated project content",
    sample: <LockIcon />,
  },
  {
    name: "Eye / eye-off",
    source: "ProjectModal",
    usage: "Show / hide password",
    sample: (
      <div className="flex items-center gap-4">
        <EyeIcon />
        <EyeOffIcon />
      </div>
    ),
  },
  {
    name: "Sun / moon",
    source: "Footer",
    usage: "Local time day / night indicator",
    sample: (
      <div className="flex items-center gap-4">
        <SunIcon />
        <MoonIcon />
      </div>
    ),
  },
  {
    name: "Check",
    source: "lucide-react (shadcn)",
    usage: "Checkbox & menu selected states",
    sample: <CheckIcon />,
  },
];

const socialIcons: IconSpecimen[] = [
  {
    name: "Instagram",
    source: "Footer · svg-2tsxp86msm",
    usage: "Footer social row, community cards",
    sample: (
      <SocialLinksBackgroundImage>
        <path d={svgPaths.p2c5f2300} fill="currentColor" />
      </SocialLinksBackgroundImage>
    ),
  },
  {
    name: "X",
    source: "Footer / View on X CTA",
    usage: "Footer social, experiment CTAs",
    sample: (
      <svg className="h-4 w-[19px] fill-current" viewBox="0 0 19 18" aria-hidden>
        <path d={X_LOGO_PATH} />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    source: "Footer · svg-2tsxp86msm",
    usage: "Footer social row",
    sample: (
      <SocialLinksBackgroundImage>
        <path d={svgPaths.p1e086000} fill="currentColor" stroke="currentColor" />
      </SocialLinksBackgroundImage>
    ),
  },
  {
    name: "Luma",
    source: "assets/LumaLogo.svg",
    usage: "Footer social row",
    sample: (
      <img
        src={LumaLogo}
        alt=""
        className="size-6"
        style={{
          filter:
            "brightness(0) saturate(100%) invert(48%) sepia(6%) saturate(500%) hue-rotate(182deg) brightness(94%) contrast(88%)",
        }}
      />
    ),
  },
];

export default function IconSection() {
  return (
    <Section id="icons" title="Iconography">
      <SubLabel note="Navigation, actions, feedback, and form affordances — text-zinc-500 · strokeWidth 1.5.">
        UI icons
      </SubLabel>
      <Grid min="160px">
        {uiIcons.map((icon) => (
          <IconCard key={icon.name} {...icon} />
        ))}
      </Grid>

      <SubLabel note="Footer & community social marks (monochrome zinc-500 in this section).">Social</SubLabel>
      <Grid min="160px">
        {socialIcons.map((icon) => (
          <IconCard key={icon.name} {...icon} />
        ))}
      </Grid>
    </Section>
  );
}
