import type { TreeInfo } from "@/viewer/types/format";
import type { OdrElement } from "../elements";
import { FolderOpen, Route, Layers, RectangleHorizontal, MapIcon, GitFork, Link } from "lucide-react";

/**
 * 提供场景树信息
 */
export function provideTreeInfo(element: OdrElement): TreeInfo {
  const iconClass = "w-4 h-4 shrink-0 text-muted-foreground";

  switch (element.type) {
    case "map":
      return { icon: <MapIcon className={iconClass} />, menus: [] };
    case "roads":
      return { icon: <FolderOpen className={iconClass} />, menus: [], virtual: true };
    case "junctions":
      return { icon: <FolderOpen className={iconClass} />, menus: [], virtual: true };
    case "junction":
      return { icon: <GitFork className={iconClass} />, menus: [] };
    case "junction-connection":
      return { icon: <Link className={iconClass} />, menus: [] };
    case "road":
      return { icon: <Route className={iconClass} />, menus: [] };
    case "lane-section":
      return { icon: <Layers className={iconClass} />, menus: [], virtual: true };
    case "lane":
      return { icon: <RectangleHorizontal className={iconClass} />, menus: [] };
    default:
      return { icon: null, menus: [] };
  }
}
