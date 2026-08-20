import type { CategoryId } from "@/lib/week";

export const PAPER = "#F4F1E8";
export const WOW_DOWN = "#9A4540";

export const CATEGORY_COLOR: Record<string, string> = {
  all: "#141413",
  agents: "#2F6FED",
  docs: "#C45C14",
  content: "#C11A7A",
  agency: "#1F7A4D",
  consumer: "#7A3CFF",
  local: "#6B1212",
  money: "#0F7A8C",
};

/** 12px labels on paper. Tiles/strokes keep CATEGORY_COLOR. */
export const CATEGORY_LABEL_COLOR: Record<string, string> = {
  all: "#141413",
  agents: "#2963D5",
  docs: "#B05212",
  content: "#C11A7A",
  agency: "#1F7A4D",
  consumer: "#7A3CFF",
  local: "#6B1212",
  money: "#0E7385",
};

export function categoryColor(id: string): string {
  return CATEGORY_COLOR[id] ?? "#141413";
}

export function categoryLabelColor(id: string): string {
  return CATEGORY_LABEL_COLOR[id] ?? "#141413";
}

const ink = {
  fill: "none" as const,
  stroke: "#fff",
  strokeWidth: 1.6,
  strokeLinecap: "square" as const,
  strokeLinejoin: "miter" as const,
};

function Frame({
  fill,
  children,
}: {
  fill: string;
  children: React.ReactNode;
}) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="block">
      <rect width="16" height="16" rx="2" fill={fill} />
      {children}
    </svg>
  );
}

export function CategoryIcon({
  id,
}: {
  id: CategoryId | string;
}) {
  const fill = categoryColor(id);
  switch (id) {
    case "agents":
      return (
        <Frame fill={fill}>
          <rect x="3" y="3.5" width="10" height="6.5" {...ink} />
          <path d="M5 13.5 L7 10.5 H10" {...ink} />
        </Frame>
      );
    case "docs":
      return (
        <Frame fill={fill}>
          <path d="M4 2.5 h6 l3.5 3.5 V13.5 H4 z" {...ink} />
          <path d="M10 2.5 V6 h3.5" {...ink} />
        </Frame>
      );
    case "content":
      return (
        <Frame fill={fill}>
          <rect x="2.5" y="3.5" width="11" height="9" {...ink} />
          <path d="M6.5 6.2 l4 2.3 -4 2.3 z" {...ink} />
        </Frame>
      );
    case "agency":
      return (
        <Frame fill={fill}>
          <rect x="2.5" y="5.5" width="7" height="7" {...ink} />
          <rect x="6.5" y="2.5" width="7" height="7" {...ink} />
        </Frame>
      );
    case "consumer":
      return (
        <Frame fill={fill}>
          <circle cx="8" cy="8" r="5" {...ink} />
          <path d="M5.5 10 Q8 12 10.5 10" {...ink} />
        </Frame>
      );
    case "local":
      return (
        <Frame fill={fill}>
          <path d="M2.5 7.5 L8 3 L13.5 7.5" {...ink} />
          <path d="M4 7.5 V13.5 H12 V7.5" {...ink} />
        </Frame>
      );
    case "money":
      return (
        <Frame fill={fill}>
          <rect x="3.5" y="3.5" width="9" height="9" {...ink} />
          <path d="M8 5.5 v5 M5.5 7.2 h5 M5.5 9.2 h5" {...ink} />
        </Frame>
      );
    default:
      return (
        <Frame fill={fill}>
          <path d="M3.5 3.5 h4 v4 h-4 z M8.5 3.5 h4 v4 h-4 z M3.5 8.5 h4 v4 h-4 z M8.5 8.5 h4 v4 h-4 z" {...ink} />
        </Frame>
      );
  }
}
