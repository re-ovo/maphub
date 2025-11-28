# Web Viewer 架构设计文档

## 1. 核心概念

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           MapDocument                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │ OpenDriveDoc    │  │  ApolloMapDoc   │  │  FutureMapDoc   │         │
│  │ (implements)    │  │  (implements)   │  │  (implements)   │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                ┌──────────────────┼──────────────────┐
                │                  │                  │
                ▼                  ▼                  ▼
        ┌─────────────┐   ┌─────────────┐    ┌─────────────┐
        │ SceneTree   │   │  Renderer   │    │ Interaction │
        │  Provider   │   │  Adapter    │    │  Handler    │
        └─────────────┘   └─────────────┘    └─────────────┘
```

## 2. 文件结构设计

```
web/src/
├── viewer/
│   ├── types.ts                    # 核心类型定义
│   ├── viewer.tsx                  # 主查看器组件
│   │
│   ├── interaction/                # 交互事件处理
│   │   ├── index.ts
│   │   ├── types.ts                # 交互类型定义
│   │   ├── pick-manager.ts         # 拾取管理器
│   │   ├── hover-manager.ts        # 悬停高亮管理
│   │   └── action-registry.ts      # Action 注册表
│   │
│   ├── scene-tree/                 # 场景树相关
│   │   ├── index.ts
│   │   ├── types.ts                # 场景树节点类型
│   │   ├── tree-provider.ts        # 抽象场景树提供者
│   │   ├── odr-tree-provider.ts    # OpenDrive 树提供者
│   │   └── apollo-tree-provider.ts # Apollo 树提供者
│   │
│   ├── document/                   # 地图文档抽象
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── map-document.ts         # 抽象地图文档接口
│   │   ├── odr-document.ts         # OpenDrive 文档实现
│   │   └── apollo-document.ts      # Apollo 文档实现
│   │
│   ├── renderer/                   # 渲染器
│   │   ├── base-renderer.ts        # 抽象基类
│   │   ├── odr/
│   │   └── apollo/
│   │
│   └── panels/
│       ├── viewport-panel.tsx
│       ├── scene-tree-panel.tsx
│       └── properties-panel.tsx
│
└── store/
    ├── index.ts
    ├── pref-slice.ts
    ├── scene-slice.ts
    └── document-slice.ts           # 文档状态管理
```

## 3. 核心类型定义

### 3.1 `viewer/types.ts`

```typescript
import type { ApolloMap, OpenDrive } from "core";

// ============= 地图类型枚举 =============
export type MapFormat = "opendrive" | "apollo";

// 原始地图数据
export type RawMapData = OpenDrive | ApolloMap;

// ============= 可拾取对象标识 =============
export interface PickableId {
  documentId: string;      // 所属文档ID
  format: MapFormat;       // 地图格式
  elementType: string;     // 元素类型 (如 "road", "lane", "junction")
  elementId: string;       // 元素ID
  subPath?: string[];      // 子路径 (如 ["laneSection", "0", "lane", "-1"])
}

// ============= 悬停信息 =============
export interface HoverInfo {
  title: string;
  subtitle?: string;
  properties: { label: string; value: string }[];
  position: { x: number; y: number }; // 屏幕坐标
}

// ============= Action 定义 =============
export interface ActionDefinition {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  handler: (target: PickableId) => void | Promise<void>;
  isVisible?: (target: PickableId) => boolean;
  isEnabled?: (target: PickableId) => boolean;
}
```

### 3.2 `viewer/interaction/types.ts`

```typescript
import type { PickableId, HoverInfo, ActionDefinition } from "../types";
import type { PointerInfo } from "@babylonjs/core";

// 交互事件类型
export type InteractionEventType =
  | "hover"
  | "click"
  | "doubleClick"
  | "rightClick"
  | "select"
  | "deselect";

export interface InteractionEvent {
  type: InteractionEventType;
  target: PickableId | null;
  pointerInfo: PointerInfo;
  screenPosition: { x: number; y: number };
  modifiers: {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
  };
}

// 交互处理器接口
export interface InteractionHandler {
  onHover?: (event: InteractionEvent) => HoverInfo | null;
  onClick?: (event: InteractionEvent) => void;
  onDoubleClick?: (event: InteractionEvent) => void;
  onRightClick?: (event: InteractionEvent) => ActionDefinition[];
  onSelect?: (event: InteractionEvent) => void;
}
```

## 4. 地图文档接口

### 4.1 `viewer/document/types.ts`

```typescript
import type {
  MapFormat,
  RawMapData,
  PickableId,
  HoverInfo,
  ActionDefinition
} from "../types";
import type { SceneTreeNode } from "../scene-tree/types";
import type { Scene, AbstractMesh } from "@babylonjs/core";

export interface MapDocument {
  // 基础信息
  readonly id: string;
  readonly name: string;
  readonly format: MapFormat;
  readonly rawData: RawMapData;

  // 场景树提供
  getSceneTreeRoot(): SceneTreeNode;

  // 渲染
  render(scene: Scene): AbstractMesh;
  dispose(): void;

  // 交互支持
  getHoverInfo(elementId: PickableId): HoverInfo | null;
  getActions(elementId: PickableId): ActionDefinition[];

  // 查询
  findElement(elementId: PickableId): unknown | null;
  getElementPath(elementId: PickableId): SceneTreeNode[];
}
```

### 4.2 `viewer/document/odr-document.ts`

```typescript
import type { OpenDrive } from "core";
import type { MapDocument } from "./types";
import type { SceneTreeNode } from "../scene-tree/types";
import type { PickableId, HoverInfo, ActionDefinition } from "../types";

export class OpenDriveDocument implements MapDocument {
  readonly id: string;
  readonly name: string;
  readonly format = "opendrive" as const;
  readonly rawData: OpenDrive;

  constructor(id: string, name: string, data: OpenDrive) {
    this.id = id;
    this.name = name;
    this.rawData = data;
  }

  getSceneTreeRoot(): SceneTreeNode {
    return {
      id: `${this.id}:root`,
      label: this.name,
      type: "opendrive",
      icon: "map",
      children: [
        this.createRoadsNode(),
        this.createJunctionsNode(),
        // ...
      ],
    };
  }

  private createRoadsNode(): SceneTreeNode {
    return {
      id: `${this.id}:roads`,
      label: `Roads (${this.rawData.roads.length})`,
      type: "folder",
      icon: "folder",
      children: this.rawData.roads.map((road) => ({
        id: `${this.id}:road:${road.id}`,
        label: road.name || `Road ${road.id}`,
        type: "road",
        icon: "road",
        data: { roadId: road.id },
        children: [
          // lane sections, objects, signals...
        ],
      })),
    };
  }

  getHoverInfo(elementId: PickableId): HoverInfo | null {
    // 根据 elementType 返回不同的悬停信息
    switch (elementId.elementType) {
      case "road":
        const road = this.findRoad(elementId.elementId);
        if (!road) return null;
        return {
          title: road.name || `Road ${road.id}`,
          subtitle: "OpenDrive Road",
          properties: [
            { label: "ID", value: road.id },
            { label: "Length", value: `${road.length.toFixed(2)}m` },
            { label: "Junction", value: road.junction || "None" },
          ],
          position: { x: 0, y: 0 }, // 将被覆盖
        };
      // ... 其他类型
    }
    return null;
  }

  getActions(elementId: PickableId): ActionDefinition[] {
    const baseActions: ActionDefinition[] = [
      {
        id: "focus",
        label: "聚焦",
        icon: "crosshair",
        handler: () => this.focusElement(elementId),
      },
      {
        id: "properties",
        label: "显示属性",
        icon: "info",
        handler: () => this.showProperties(elementId),
      },
    ];

    // 根据元素类型添加特定 actions
    if (elementId.elementType === "road") {
      baseActions.push({
        id: "highlight-lanes",
        label: "高亮所有车道",
        icon: "layers",
        handler: () => this.highlightLanes(elementId),
      });
    }

    return baseActions;
  }

  // ... 实现其他方法
}
```

## 5. 场景树类型

### 5.1 `viewer/scene-tree/types.ts`

```typescript
import type { PickableId } from "../types";

export interface SceneTreeNode {
  id: string;                      // 唯一标识
  label: string;                   // 显示名称
  type: string;                    // 节点类型
  icon?: string;                   // 图标名称
  visible?: boolean;               // 是否可见
  selected?: boolean;              // 是否选中
  expanded?: boolean;              // 是否展开
  children?: SceneTreeNode[];      // 子节点
  data?: Record<string, unknown>;  // 附加数据

  // 关联的 PickableId（用于点击同步）
  pickableId?: PickableId;
}

export interface SceneTreeState {
  nodes: SceneTreeNode[];
  selectedIds: Set<string>;
  expandedIds: Set<string>;
  visibilityMap: Map<string, boolean>;
}
```

## 6. 交互管理器

### 6.1 `viewer/interaction/pick-manager.ts`

```typescript
import type { Scene, AbstractMesh, PointerInfo } from "@babylonjs/core";
import type { PickableId } from "../types";

// Mesh 元数据接口
interface PickableMeshMetadata {
  pickableId: PickableId;
}

export class PickManager {
  private scene: Scene;
  private meshToIdMap = new WeakMap<AbstractMesh, PickableId>();

  constructor(scene: Scene) {
    this.scene = scene;
  }

  // 注册可拾取的 Mesh
  registerPickable(mesh: AbstractMesh, pickableId: PickableId): void {
    mesh.isPickable = true;
    mesh.metadata = { ...mesh.metadata, pickableId };
    this.meshToIdMap.set(mesh, pickableId);
  }

  // 从 PointerInfo 获取 PickableId
  getPickedId(pointerInfo: PointerInfo): PickableId | null {
    const pickResult = this.scene.pick(
      pointerInfo.event.clientX,
      pointerInfo.event.clientY
    );

    if (!pickResult?.hit || !pickResult.pickedMesh) {
      return null;
    }

    return pickResult.pickedMesh.metadata?.pickableId ?? null;
  }

  // 通过 PickableId 查找 Mesh
  findMeshByPickableId(id: PickableId): AbstractMesh | null {
    for (const mesh of this.scene.meshes) {
      const metadata = mesh.metadata as PickableMeshMetadata | undefined;
      if (metadata?.pickableId && this.isSamePickableId(metadata.pickableId, id)) {
        return mesh;
      }
    }
    return null;
  }

  private isSamePickableId(a: PickableId, b: PickableId): boolean {
    return (
      a.documentId === b.documentId &&
      a.elementType === b.elementType &&
      a.elementId === b.elementId
    );
  }
}
```

### 6.2 `viewer/interaction/hover-manager.ts`

```typescript
import type { Scene, AbstractMesh, HighlightLayer } from "@babylonjs/core";
import { Color3 } from "@babylonjs/core";
import type { PickableId, HoverInfo } from "../types";
import type { MapDocument } from "../document/types";

export class HoverManager {
  private scene: Scene;
  private highlightLayer: HighlightLayer;
  private currentHoveredMesh: AbstractMesh | null = null;
  private documents: Map<string, MapDocument>;

  constructor(scene: Scene, documents: Map<string, MapDocument>) {
    this.scene = scene;
    this.documents = documents;
    this.highlightLayer = new HighlightLayer("hoverHighlight", scene);
    this.highlightLayer.outerGlow = true;
    this.highlightLayer.innerGlow = false;
  }

  setHovered(mesh: AbstractMesh | null, pickableId: PickableId | null): HoverInfo | null {
    // 清除之前的高亮
    if (this.currentHoveredMesh) {
      this.highlightLayer.removeMesh(this.currentHoveredMesh);
    }

    this.currentHoveredMesh = mesh;

    if (!mesh || !pickableId) {
      return null;
    }

    // 添加高亮
    this.highlightLayer.addMesh(mesh, Color3.FromHexString("#4a9eff"));

    // 获取悬停信息
    const document = this.documents.get(pickableId.documentId);
    return document?.getHoverInfo(pickableId) ?? null;
  }

  dispose(): void {
    this.highlightLayer.dispose();
  }
}
```

### 6.3 `viewer/interaction/index.ts` (主交互管理器)

```typescript
import type { Scene, PointerInfo, Observer } from "@babylonjs/core";
import { PointerEventTypes } from "@babylonjs/core";
import type { PickableId, HoverInfo, ActionDefinition } from "../types";
import type { MapDocument } from "../document/types";
import { PickManager } from "./pick-manager";
import { HoverManager } from "./hover-manager";

export interface InteractionCallbacks {
  onHoverChange?: (info: HoverInfo | null) => void;
  onSelectionChange?: (ids: PickableId[]) => void;
  onContextMenu?: (actions: ActionDefinition[], position: { x: number; y: number }) => void;
}

export class InteractionManager {
  private scene: Scene;
  private pickManager: PickManager;
  private hoverManager: HoverManager;
  private documents: Map<string, MapDocument>;
  private callbacks: InteractionCallbacks;
  private selectedIds: PickableId[] = [];
  private pointerObserver: Observer<PointerInfo> | null = null;

  constructor(
    scene: Scene,
    documents: Map<string, MapDocument>,
    callbacks: InteractionCallbacks
  ) {
    this.scene = scene;
    this.documents = documents;
    this.callbacks = callbacks;
    this.pickManager = new PickManager(scene);
    this.hoverManager = new HoverManager(scene, documents);

    this.setupPointerObserver();
  }

  private setupPointerObserver(): void {
    this.pointerObserver = this.scene.onPointerObservable.add((pointerInfo) => {
      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERMOVE:
          this.handlePointerMove(pointerInfo);
          break;
        case PointerEventTypes.POINTERPICK:
          this.handlePointerPick(pointerInfo);
          break;
        case PointerEventTypes.POINTERDOWN:
          if (pointerInfo.event.button === 2) {
            this.handleRightClick(pointerInfo);
          }
          break;
      }
    });
  }

  private handlePointerMove(pointerInfo: PointerInfo): void {
    const pickableId = this.pickManager.getPickedId(pointerInfo);
    const mesh = pickableId
      ? this.pickManager.findMeshByPickableId(pickableId)
      : null;

    const hoverInfo = this.hoverManager.setHovered(mesh, pickableId);

    if (hoverInfo) {
      hoverInfo.position = {
        x: pointerInfo.event.clientX,
        y: pointerInfo.event.clientY,
      };
    }

    this.callbacks.onHoverChange?.(hoverInfo);
  }

  private handlePointerPick(pointerInfo: PointerInfo): void {
    const pickableId = this.pickManager.getPickedId(pointerInfo);

    if (!pickableId) {
      this.selectedIds = [];
    } else if (pointerInfo.event.ctrlKey || pointerInfo.event.metaKey) {
      // 多选
      const index = this.selectedIds.findIndex(
        (id) => this.isSameId(id, pickableId)
      );
      if (index >= 0) {
        this.selectedIds.splice(index, 1);
      } else {
        this.selectedIds.push(pickableId);
      }
    } else {
      // 单选
      this.selectedIds = [pickableId];
    }

    this.callbacks.onSelectionChange?.([...this.selectedIds]);
  }

  private handleRightClick(pointerInfo: PointerInfo): void {
    const pickableId = this.pickManager.getPickedId(pointerInfo);
    if (!pickableId) return;

    const document = this.documents.get(pickableId.documentId);
    if (!document) return;

    const actions = document.getActions(pickableId);
    this.callbacks.onContextMenu?.(actions, {
      x: pointerInfo.event.clientX,
      y: pointerInfo.event.clientY,
    });
  }

  // 公开方法：通过场景树选中元素
  selectByPickableId(id: PickableId): void {
    this.selectedIds = [id];
    this.callbacks.onSelectionChange?.([...this.selectedIds]);

    // 高亮对应的 Mesh
    const mesh = this.pickManager.findMeshByPickableId(id);
    if (mesh) {
      // 可以添加选中高亮效果
    }
  }

  // 公开方法：聚焦到元素
  focusOnElement(id: PickableId): void {
    const mesh = this.pickManager.findMeshByPickableId(id);
    if (mesh && this.scene.activeCamera) {
      // 计算相机移动目标
      const boundingBox = mesh.getBoundingInfo().boundingBox;
      const center = boundingBox.centerWorld;
      // ... 相机动画
    }
  }

  getPickManager(): PickManager {
    return this.pickManager;
  }

  dispose(): void {
    if (this.pointerObserver) {
      this.scene.onPointerObservable.remove(this.pointerObserver);
    }
    this.hoverManager.dispose();
  }

  private isSameId(a: PickableId, b: PickableId): boolean {
    return (
      a.documentId === b.documentId &&
      a.elementType === b.elementType &&
      a.elementId === b.elementId
    );
  }
}
```

## 7. Store 扩展

### 7.1 `store/document-slice.ts`

```typescript
import type { StateCreator } from "zustand";
import type { MapDocument } from "@/viewer/document/types";
import type { PickableId, HoverInfo, ActionDefinition } from "@/viewer/types";
import type { SceneTreeNode } from "@/viewer/scene-tree/types";

export interface DocumentSlice {
  // 已加载的文档
  documents: Map<string, MapDocument>;
  addDocument: (doc: MapDocument) => void;
  removeDocument: (id: string) => void;

  // 选中状态
  selectedIds: PickableId[];
  setSelectedIds: (ids: PickableId[]) => void;

  // 悬停状态
  hoverInfo: HoverInfo | null;
  setHoverInfo: (info: HoverInfo | null) => void;

  // 上下文菜单
  contextMenu: {
    visible: boolean;
    actions: ActionDefinition[];
    position: { x: number; y: number };
  };
  showContextMenu: (actions: ActionDefinition[], position: { x: number; y: number }) => void;
  hideContextMenu: () => void;

  // 场景树（合并所有文档）
  getSceneTreeNodes: () => SceneTreeNode[];

  // 场景树展开/选中状态
  expandedNodeIds: Set<string>;
  toggleNodeExpanded: (id: string) => void;
}

export const createDocumentSlice: StateCreator<DocumentSlice> = (set, get) => ({
  documents: new Map(),
  addDocument: (doc) =>
    set((state) => {
      const newDocs = new Map(state.documents);
      newDocs.set(doc.id, doc);
      return { documents: newDocs };
    }),
  removeDocument: (id) =>
    set((state) => {
      const newDocs = new Map(state.documents);
      newDocs.delete(id);
      return { documents: newDocs };
    }),

  selectedIds: [],
  setSelectedIds: (ids) => set({ selectedIds: ids }),

  hoverInfo: null,
  setHoverInfo: (info) => set({ hoverInfo: info }),

  contextMenu: { visible: false, actions: [], position: { x: 0, y: 0 } },
  showContextMenu: (actions, position) =>
    set({ contextMenu: { visible: true, actions, position } }),
  hideContextMenu: () =>
    set((state) => ({ contextMenu: { ...state.contextMenu, visible: false } })),

  getSceneTreeNodes: () => {
    const { documents } = get();
    return Array.from(documents.values()).map((doc) => doc.getSceneTreeRoot());
  },

  expandedNodeIds: new Set(),
  toggleNodeExpanded: (id) =>
    set((state) => {
      const newSet = new Set(state.expandedNodeIds);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { expandedNodeIds: newSet };
    }),
});
```

## 8. 数据流图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              User Actions                                    │
└─────────────────────────────────────────────────────────────────────────────┘
        │                           │                           │
        │ 鼠标悬停                   │ 鼠标点击                   │ 右键菜单
        ▼                           ▼                           ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│PointerMove    │          │PointerPick    │          │PointerDown    │
│ Event         │          │ Event         │          │ (button=2)    │
└───────────────┘          └───────────────┘          └───────────────┘
        │                           │                           │
        ▼                           ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          InteractionManager                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────────┐     │
│  │PickManager  │───▶│PickableId   │───▶│ MapDocument.getHoverInfo()  │     │
│  │.getPickedId │    │             │    │ MapDocument.getActions()    │     │
│  └─────────────┘    └─────────────┘    └─────────────────────────────┘     │
│                            │                          │                     │
│                            ▼                          ▼                     │
│                     ┌─────────────┐          ┌─────────────┐               │
│                     │HoverManager │          │ Callbacks   │               │
│                     │.setHovered  │          │             │               │
│                     └─────────────┘          └─────────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│store.         │          │store.         │          │store.         │
│setHoverInfo   │          │setSelectedIds │          │showContextMenu│
└───────────────┘          └───────────────┘          └───────────────┘
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│ HoverTooltip  │          │ SceneTreePanel│          │ ContextMenu   │
│ Component     │          │ (sync select) │          │ Component     │
└───────────────┘          └───────────────┘          └───────────────┘
```

## 9. 场景树与3D视口同步

```typescript
// 在 SceneTreePanel 中
function SceneTreePanel() {
  const {
    getSceneTreeNodes,
    selectedIds,
    setSelectedIds,
    expandedNodeIds,
    toggleNodeExpanded
  } = useStore();

  const interactionManager = useInteractionManager(); // 通过 Context 获取

  const handleNodeClick = (node: SceneTreeNode) => {
    if (node.pickableId) {
      // 同步选中到3D视口
      interactionManager.selectByPickableId(node.pickableId);
      setSelectedIds([node.pickableId]);
    }
  };

  const handleNodeDoubleClick = (node: SceneTreeNode) => {
    if (node.pickableId) {
      // 聚焦相机到该元素
      interactionManager.focusOnElement(node.pickableId);
    }
  };

  const handleContextMenu = (node: SceneTreeNode, position: { x: number; y: number }) => {
    if (node.pickableId) {
      const doc = documents.get(node.pickableId.documentId);
      if (doc) {
        const actions = doc.getActions(node.pickableId);
        showContextMenu(actions, position);
      }
    }
  };

  // 渲染...
}
```

## 10. 使用示例

```typescript
// 加载文件时
const handleFilesDropped = async (files: File[]) => {
  const file = files[0];
  const content = new Uint8Array(await file.arrayBuffer());

  // 检测格式并解析
  if (file.name.endsWith('.xodr')) {
    const odr = parseOpendrive(content);
    const doc = new OpenDriveDocument(
      generateId(),
      file.name,
      odr
    );
    addDocument(doc);

    // 渲染到场景
    const mesh = doc.render(scene);
    interactionManager.getPickManager().registerPickable(
      mesh,
      { documentId: doc.id, format: 'opendrive', elementType: 'root', elementId: 'root' }
    );
  } else if (file.name.endsWith('.bin')) {
    const apolloMap = parseApolloMap(content);
    const doc = new ApolloMapDocument(generateId(), file.name, apolloMap);
    addDocument(doc);
    // ...
  }
};
```

## 11. 关键设计点总结

1. **MapDocument 抽象** - 每种地图格式实现相同接口，提供统一的场景树、悬停信息和 Actions

2. **PickableId 统一标识** - 连接 3D Mesh 和逻辑数据结构的桥梁

3. **InteractionManager 解耦** - 将事件处理逻辑独立，通过回调与 UI 交互

4. **Store 集中管理** - 选中状态、悬停信息、上下文菜单都通过 Zustand 管理，确保多面板同步

5. **可扩展性** - 新增地图格式只需实现 `MapDocument` 接口，无需修改核心交互逻辑
