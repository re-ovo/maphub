import type { OpenDrive } from "core";
import type { Selectable } from "../../types";
import type { HoverInfo, HoverInfoProvider } from "../../types";

/** OpenDrive 悬浮信息提供者 */
export class OpenDriveHoverProvider implements HoverInfoProvider {
  private odr: OpenDrive;

  constructor(odr: OpenDrive) {
    this.odr = odr;
  }

  getHoverInfo(selectable: Selectable): HoverInfo | null {
    const { type, path } = selectable;

    switch (type) {
      case "road":
        return this.getRoadHoverInfo(path);
      case "lane-section":
        return this.getLaneSectionHoverInfo(path);
      case "lane":
        return this.getLaneHoverInfo(path);
      default:
        return null;
    }
  }

  private getRoadHoverInfo(roadId: string): HoverInfo | null {
    const road = this.odr.roads?.find((r) => r.id === roadId);
    if (!road) return null;

    return {
      title: road.name || `Road ${roadId}`,
      subtitle: "OpenDRIVE Road",
      items: [
        { label: "ID", value: road.id },
        { label: "Length", value: `${road.length.toFixed(2)} m` },
        { label: "Sections", value: `${road.lanes?.length || 0}` },
      ],
    };
  }

  private getLaneSectionHoverInfo(path: string): HoverInfo | null {
    const [roadId, , sectionIdxStr] = path.split("/");
    const sectionIndex = parseInt(sectionIdxStr, 10);

    const road = this.odr.roads?.find((r) => r.id === roadId);
    const section = road?.lanes?.[sectionIndex];
    if (!section) return null;

    const leftCount = section.left?.length || 0;
    const rightCount = section.right?.length || 0;

    return {
      title: `Lane Section ${sectionIndex}`,
      subtitle: `Road ${roadId}`,
      items: [
        { label: "S", value: `${section.s.toFixed(2)} m` },
        { label: "Lanes", value: `${leftCount}L / ${rightCount}R` },
      ],
    };
  }

  private getLaneHoverInfo(path: string): HoverInfo | null {
    const parts = path.split("/");
    const roadId = parts[0];
    const sectionIndex = parseInt(parts[2], 10);
    const laneId = parseInt(parts[4], 10);

    const road = this.odr.roads?.find((r) => r.id === roadId);
    const section = road?.lanes?.[sectionIndex];
    if (!section) return null;

    const allLanes = [
      ...(section.left || []),
      section.center,
      ...(section.right || []),
    ];
    const lane = allLanes.find((l) => l.id === laneId);
    if (!lane) return null;

    const side = laneId > 0 ? "Left" : laneId < 0 ? "Right" : "Center";

    return {
      title: `Lane ${laneId}`,
      subtitle: `${side} · ${lane.type}`,
      items: [
        { label: "Type", value: lane.type },
        { label: "Side", value: side },
      ],
    };
  }
}
