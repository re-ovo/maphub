import type { HoverInfo } from "@/viewer/types/format";

interface HoverTooltipProps {
  infos: HoverInfo[];
  position: { x: number; y: number };
}

function HoverInfoItem({ info }: { info: HoverInfo }) {
  return (
    <div>
      {/* 标题区域 */}
      <div className="flex items-center gap-2 mb-1">
        {info.icon && <span className="text-muted-foreground">{info.icon}</span>}
        <span className="font-medium text-sm">{info.title}</span>
      </div>

      {/* 描述 */}
      {info.description.length > 0 && (
        <div className="text-xs text-muted-foreground mb-2">
          {info.description.map((desc, i) => (
            <div key={i}>{desc}</div>
          ))}
        </div>
      )}

      {/* 属性列表 */}
      {info.items.length > 0 && (
        <div className="space-y-0.5 text-xs">
          {info.items.map((item, i) => (
            <div key={i} className="flex justify-between gap-4">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function HoverTooltip({ infos, position }: HoverTooltipProps) {
  return (
    <div
      className="pointer-events-none fixed z-50 max-w-xs rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md"
      style={{
        left: 0,
        top: 0,
        transform: `translate(${position.x + 12}px, ${position.y + 12}px)`,
        willChange: "transform",
      }}
    >
      {infos.map((info, index) => (
        <div key={index}>
          {index > 0 && <hr className="my-2 border-border" />}
          <HoverInfoItem info={info} />
        </div>
      ))}
    </div>
  );
}
