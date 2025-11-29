import type { OpenDrive, OdrRoad, OdrLaneSection, OdrLane } from "core";
import type { Selectable } from "../../types";
import type {
  PropertyProvider,
  PropertyGroup,
  PropertyItem,
} from "../../types";

/** OpenDrive 属性面板提供者 */
export class OpenDrivePropertyProvider implements PropertyProvider {
  private odr: OpenDrive;

  constructor(odr: OpenDrive) {
    this.odr = odr;
  }

  getTitle(selectable: Selectable): { title: string; subtitle?: string } {
    const { type, path } = selectable;

    switch (type) {
      case "road": {
        const road = this.findRoad(path);
        return {
          title: road?.name || `Road ${path}`,
          subtitle: "OpenDRIVE Road",
        };
      }
      case "lane-section": {
        const [roadId, , sectionIdx] = path.split("/");
        return {
          title: `Lane Section ${sectionIdx}`,
          subtitle: `Road ${roadId}`,
        };
      }
      case "lane": {
        const parts = path.split("/");
        const laneId = parts[parts.length - 1];
        return {
          title: `Lane ${laneId}`,
          subtitle: `Road ${parts[0]}`,
        };
      }
      default:
        return { title: type, subtitle: path };
    }
  }

  getProperties(selectable: Selectable): PropertyGroup[] {
    const { type, path } = selectable;

    switch (type) {
      case "road":
        return this.getRoadProperties(path);
      case "lane-section":
        return this.getLaneSectionProperties(path);
      case "lane":
        return this.getLaneProperties(path);
      default:
        return [];
    }
  }

  private findRoad(roadId: string): OdrRoad | undefined {
    return this.odr.roads?.find((r) => r.id === roadId);
  }

  private findLaneSection(
    roadId: string,
    sectionIndex: number
  ): OdrLaneSection | undefined {
    const road = this.findRoad(roadId);
    return road?.lanes?.[sectionIndex];
  }

  private findLane(
    roadId: string,
    sectionIndex: number,
    laneId: number
  ): OdrLane | undefined {
    const section = this.findLaneSection(roadId, sectionIndex);
    if (!section) return undefined;

    const allLanes = [
      ...(section.left || []),
      section.center,
      ...(section.right || []),
    ];
    return allLanes.find((l) => l.id === laneId);
  }

  private getRoadProperties(roadId: string): PropertyGroup[] {
    const road = this.findRoad(roadId);
    if (!road) return [];

    const basicProps: PropertyItem[] = [
      { key: "id", label: "ID", value: road.id, type: "string", readonly: true },
      {
        key: "name",
        label: "Name",
        value: road.name || "-",
        type: "string",
        readonly: true,
      },
      {
        key: "length",
        label: "Length",
        value: road.length,
        type: "number",
        unit: "m",
        readonly: true,
      },
      {
        key: "junction",
        label: "Junction",
        value: road.junction || "-1",
        type: "string",
        readonly: true,
      },
    ];

    const linkProps: PropertyItem[] = [];
    if (road.predecessor) {
      linkProps.push({
        key: "predecessor",
        label: "Predecessor",
        value: `${road.predecessor.elementType} ${road.predecessor.elementId}`,
        type: "link",
        readonly: true,
      });
    }
    if (road.successor) {
      linkProps.push({
        key: "successor",
        label: "Successor",
        value: `${road.successor.elementType} ${road.successor.elementId}`,
        type: "link",
        readonly: true,
      });
    }

    const groups: PropertyGroup[] = [
      {
        id: "basic",
        title: "基本信息",
        defaultExpanded: true,
        properties: basicProps,
      },
    ];

    if (linkProps.length > 0) {
      groups.push({
        id: "link",
        title: "连接关系",
        defaultExpanded: true,
        properties: linkProps,
      });
    }

    // 统计信息
    const lanes = road.lanes || [];
    const totalLanes = lanes.reduce(
      (sum, s) => sum + (s.left?.length || 0) + (s.right?.length || 0),
      0
    );

    groups.push({
      id: "stats",
      title: "统计",
      defaultExpanded: false,
      properties: [
        {
          key: "laneSections",
          label: "Lane Sections",
          value: lanes.length,
          type: "number",
          readonly: true,
        },
        {
          key: "totalLanes",
          label: "Total Lanes",
          value: totalLanes,
          type: "number",
          readonly: true,
        },
        {
          key: "geometries",
          label: "Geometries",
          value: road.planView?.length || 0,
          type: "number",
          readonly: true,
        },
      ],
    });

    return groups;
  }

  private getLaneSectionProperties(path: string): PropertyGroup[] {
    const [roadId, , sectionIdxStr] = path.split("/");
    const sectionIndex = parseInt(sectionIdxStr, 10);
    const section = this.findLaneSection(roadId, sectionIndex);
    if (!section) return [];

    return [
      {
        id: "basic",
        title: "基本信息",
        defaultExpanded: true,
        properties: [
          {
            key: "s",
            label: "S Offset",
            value: section.s,
            type: "number",
            unit: "m",
            readonly: true,
          },
          {
            key: "singleSide",
            label: "Single Side",
            value: section.single_side ?? false,
            type: "boolean",
            readonly: true,
          },
        ],
      },
      {
        id: "lanes",
        title: "车道统计",
        defaultExpanded: true,
        properties: [
          {
            key: "leftCount",
            label: "Left Lanes",
            value: section.left?.length || 0,
            type: "number",
            readonly: true,
          },
          {
            key: "rightCount",
            label: "Right Lanes",
            value: section.right?.length || 0,
            type: "number",
            readonly: true,
          },
        ],
      },
    ];
  }

  private getLaneProperties(path: string): PropertyGroup[] {
    const parts = path.split("/");
    const roadId = parts[0];
    const sectionIndex = parseInt(parts[2], 10);
    const laneId = parseInt(parts[4], 10);

    const lane = this.findLane(roadId, sectionIndex, laneId);
    if (!lane) return [];

    const basicProps: PropertyItem[] = [
      {
        key: "id",
        label: "ID",
        value: lane.id,
        type: "number",
        readonly: true,
      },
      {
        key: "type",
        label: "Type",
        value: lane.type,
        type: "string",
        readonly: true,
      },
      {
        key: "level",
        label: "Level",
        value: lane.level,
        type: "boolean",
        readonly: true,
      },
    ];

    if (lane.roadWorks !== undefined) {
      basicProps.push({
        key: "roadWorks",
        label: "Road Works",
        value: lane.roadWorks,
        type: "boolean",
        readonly: true,
      });
    }

    const groups: PropertyGroup[] = [
      {
        id: "basic",
        title: "基本信息",
        defaultExpanded: true,
        properties: basicProps,
      },
    ];

    // 宽度信息
    if (lane.width && lane.width.length > 0) {
      groups.push({
        id: "width",
        title: "宽度",
        defaultExpanded: false,
        properties: lane.width.map((w, i) => ({
          key: `width_${i}`,
          label: `Width @${w.s_offset.toFixed(2)}`,
          value: `a=${w.a.toFixed(3)}, b=${w.b.toFixed(3)}`,
          type: "string" as const,
          readonly: true,
        })),
      });
    }

    // 速度限制
    if (lane.speed && lane.speed.length > 0) {
      groups.push({
        id: "speed",
        title: "速度限制",
        defaultExpanded: false,
        properties: lane.speed.map((s, i) => ({
          key: `speed_${i}`,
          label: `Speed @${s.s_offset.toFixed(2)}`,
          value: s.max,
          type: "number" as const,
          unit: s.unit || "m/s",
          readonly: true,
        })),
      });
    }

    return groups;
  }
}
