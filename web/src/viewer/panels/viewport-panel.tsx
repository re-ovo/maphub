import { useEffect, useRef, useCallback } from "react";
import {
  Engine,
  Scene,
  HemisphericLight,
  Vector3,
  MeshBuilder,
  ArcRotateCamera,
  PointerEventTypes,
  Camera,
  type PointerInfo,
} from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials";
import { useStore } from "@/store";
import { formatRegistry } from "@/viewer/formats";
import { Button } from "@/components/ui/button";

export default function ViewportPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const previousHoveredRef = useRef<string | null>(null);

  const {
    scene,
    setScene,
    showGrid,
    documents,
    selection,
    setSelection,
    hoveredNodeId,
    setHover,
    clearHover,
    cameraMode,
    toggleCameraMode,
  } = useStore();

  // 处理点击选择
  const handlePick = useCallback(
    (pointerInfo: PointerInfo) => {
      if (!scene) return;

      const pickInfo = scene.pick(
        scene.pointerX,
        scene.pointerY,
        (mesh) => mesh.isPickable
      );

      if (!pickInfo?.hit || !pickInfo.pickedMesh) {
        setSelection([]);
        return;
      }

      // 从所有文档的渲染器中查找 nodeId
      for (const doc of documents.values()) {
        const nodeId = doc.renderer.getNodeFromPick(pickInfo);
        if (nodeId) {
          // 检查是否按住 Ctrl/Cmd 进行多选
          const isMultiSelect = pointerInfo.event.ctrlKey || pointerInfo.event.metaKey;
          if (isMultiSelect) {
            useStore.getState().toggleSelection(nodeId);
          } else {
            setSelection([nodeId]);
          }
          return;
        }
      }

      // 没有命中任何可选对象
      setSelection([]);
    },
    [scene, documents, setSelection]
  );

  // 处理悬浮
  const handlePointerMove = useCallback(
    (pointerInfo: PointerInfo) => {
      if (!scene || !canvasRef.current) return;

      const pickInfo = scene.pick(
        scene.pointerX,
        scene.pointerY,
        (mesh) => mesh.isPickable
      );

      if (!pickInfo?.hit || !pickInfo.pickedMesh) {
        if (previousHoveredRef.current) {
          // 取消之前的高亮
          for (const doc of documents.values()) {
            doc.renderer.unhighlight(previousHoveredRef.current);
          }
          previousHoveredRef.current = null;
          clearHover();
        }
        return;
      }

      // 查找 nodeId
      for (const doc of documents.values()) {
        const nodeId = doc.renderer.getNodeFromPick(pickInfo);
        if (nodeId) {
          // 如果是同一个对象，不需要更新
          if (previousHoveredRef.current === nodeId) {
            return;
          }

          // 取消之前的高亮
          if (previousHoveredRef.current) {
            for (const d of documents.values()) {
              d.renderer.unhighlight(previousHoveredRef.current);
            }
          }

          // 高亮新的对象
          doc.renderer.highlight(nodeId);
          previousHoveredRef.current = nodeId;

          // 获取悬浮信息
          const node = useStore.getState().getNode(nodeId);
          const format = formatRegistry.get(doc.formatId);
          const hoverInfo = node && format ? format.getHoverInfo(node) : null;

          // 计算相对于 canvas 容器的坐标
          const rect = canvasRef.current.getBoundingClientRect();
          const position = {
            x: pointerInfo.event.clientX - rect.left,
            y: pointerInfo.event.clientY - rect.top
          };

          setHover(nodeId, hoverInfo, position);
          return;
        }
      }
    },
    [scene, documents, setHover, clearHover]
  );

  // 初始化场景
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    engineRef.current = engine;

    const newScene = new Scene(engine);
    newScene.clearColor.set(0.1, 0.1, 0.1, 1);

    // 创建相机
    const camera = new ArcRotateCamera(
      "camera",
      Math.PI / 2,
      Math.PI / 4,
      50,
      Vector3.Zero(),
      newScene
    );
    camera.attachControl(canvasRef.current, true);
    camera.wheelDeltaPercentage = 0.05;
    camera.minZ = 0.1;
    camera.panningSensibility = 100;
    camera.lowerRadiusLimit = 1;
    camera.upperRadiusLimit = 1000;

    // 创建灯光
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), newScene);
    light.intensity = 0.7;

    // 创建地面网格
    const ground = MeshBuilder.CreateGround(
      "ground",
      { width: 1000, height: 1000 },
      newScene
    );
    const gridMaterial = new GridMaterial("gridMaterial", newScene);
    gridMaterial.mainColor.set(0.3, 0.3, 0.3);
    gridMaterial.lineColor.set(0.1, 0.1, 0.1);
    gridMaterial.gridRatio = 1;
    gridMaterial.majorUnitFrequency = 10;
    gridMaterial.minorUnitVisibility = 0.45;
    gridMaterial.opacity = 0.8;
    ground.material = gridMaterial;
    ground.isPickable = false;
    ground.setEnabled(showGrid);

    setScene(newScene);

    // 渲染循环
    engine.runRenderLoop(() => {
      newScene.render();
    });

    // 监听容器大小变化（支持 Mosaic 面板拖动）
    const resizeObserver = new ResizeObserver(() => {
      engine.resize();
    });
    resizeObserver.observe(canvasRef.current);

    return () => {
      resizeObserver.disconnect();
      newScene.dispose();
      engine.dispose();
    };
  }, [setScene, showGrid]);

  // 注册指针事件
  useEffect(() => {
    if (!scene) return;

    const observer = scene.onPointerObservable.add((pointerInfo) => {
      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERPICK:
          handlePick(pointerInfo);
          break;
        case PointerEventTypes.POINTERMOVE:
          handlePointerMove(pointerInfo);
          break;
      }
    });

    return () => {
      scene.onPointerObservable.remove(observer);
    };
  }, [scene, handlePick, handlePointerMove]);

  // 更新网格可见性
  useEffect(() => {
    if (!scene) return;
    const ground = scene.getMeshByName("ground");
    if (ground) {
      ground.setEnabled(showGrid);
    }
  }, [scene, showGrid]);

  // 高亮选中的对象
  useEffect(() => {
    if (!scene) return;

    // 先取消所有高亮
    for (const doc of documents.values()) {
      doc.renderer.unhighlightAll();
    }

    // 高亮选中的对象
    for (const nodeId of selection) {
      // 找到节点所属的文档
      const node = useStore.getState().getNode(nodeId);
      if (node) {
        // 向上查找到文档节点
        let current = node;
        while (current.parentId) {
          const parent = useStore.getState().getNode(current.parentId);
          if (!parent) break;
          current = parent;
        }
        const doc = documents.get(current.id);
        if (doc) {
          doc.renderer.highlight(nodeId);
        }
      }
    }
  }, [scene, documents, selection]);

  // 更新相机模式
  useEffect(() => {
    if (!scene) return;
    const camera = scene.activeCamera as ArcRotateCamera;
    if (!camera) return;

    if (cameraMode === "orthographic") {
      camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
      // 根据当前距离计算正交视图的大小
      const orthoSize = camera.radius * 0.5;
      const aspectRatio = engineRef.current
        ? engineRef.current.getRenderWidth() / engineRef.current.getRenderHeight()
        : 1;
      camera.orthoLeft = -orthoSize * aspectRatio;
      camera.orthoRight = orthoSize * aspectRatio;
      camera.orthoTop = orthoSize;
      camera.orthoBottom = -orthoSize;
    } else {
      camera.mode = Camera.PERSPECTIVE_CAMERA;
    }
  }, [scene, cameraMode]);

  return (
    <div className="w-full h-full bg-gray-900 relative">
      <canvas ref={canvasRef} className="w-full h-full outline-none" />

      {/* 工具栏 */}
      <div className="absolute top-2 right-2 flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCameraMode}
          title={cameraMode === "perspective" ? "切换到正交视图" : "切换到透视视图"}
          className="bg-background/80 hover:bg-background"
        >
          {cameraMode === "perspective" ? "Perspective" : "Orthographic"}
        </Button>
      </div>

      {/* 悬浮信息提示 */}
      {hoveredNodeId && useStore.getState().hoverInfo && useStore.getState().hoverPosition && (
        <HoverTooltip />
      )}
    </div>
  );
}

/** 悬浮信息提示组件 */
function HoverTooltip() {
  const { hoverInfo, hoverPosition } = useStore();

  if (!hoverInfo || !hoverPosition) return null;

  return (
    <div
      className="absolute z-50 pointer-events-none bg-popover border border-border rounded-md shadow-lg p-2 text-sm"
      style={{
        left: hoverPosition.x + 10,
        top: hoverPosition.y + 10,
        maxWidth: 300,
      }}
    >
      <div className="font-medium">{hoverInfo.title}</div>
      {hoverInfo.subtitle && (
        <div className="text-xs text-muted-foreground">{hoverInfo.subtitle}</div>
      )}
      {hoverInfo.items.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {hoverInfo.items.map((item, idx) => (
            <div key={idx} className="flex justify-between gap-4 text-xs">
              <span className="text-muted-foreground">{item.label}</span>
              <span>{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
