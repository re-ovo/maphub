import {
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  OrthographicCamera,
  AmbientLight,
  DirectionalLight,
  GridHelper,
  Raycaster,
  Vector2,
  Vector3,
  Vector4,
  Quaternion,
  Matrix4,
  Spherical,
  Box3,
  Sphere,
  Color,
  Clock,
  type Intersection,
} from "three";
import CameraControls from "camera-controls";
import type { CameraMode } from "@/store/scene-slice";

// 安装 camera-controls 所需的 THREE 子模块
CameraControls.install({
  THREE: {
    Vector2,
    Vector3,
    Vector4,
    Quaternion,
    Matrix4,
    Spherical,
    Box3,
    Sphere,
    Raycaster,
  },
});

export type Camera = PerspectiveCamera | OrthographicCamera;

export interface ViewportRendererOptions {
  canvas: HTMLCanvasElement;
  showGrid?: boolean;
}

export interface RaycastResult {
  intersection: Intersection;
  position: { x: number; y: number };
}

/**
 * 视口渲染器 - 封装 Three.js 场景、相机、渲染器和控制器
 */
export class ViewportRenderer {
  readonly scene: Scene;
  readonly renderer: WebGLRenderer;
  readonly controls: CameraControls;

  private _camera: Camera;
  private _cameraMode: CameraMode = "perspective";
  private _showGrid = true;

  private readonly canvas: HTMLCanvasElement;
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private readonly gridHelper: GridHelper;
  private readonly clock = new Clock();

  private animationId = 0;
  private resizeObserver: ResizeObserver | null = null;
  private disposed = false;

  constructor(options: ViewportRendererOptions) {
    this.canvas = options.canvas;
    this._showGrid = options.showGrid ?? true;

    // 创建渲染器
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(new Color(0x1a1a1a));

    // 创建场景
    this.scene = new Scene();

    // 创建相机
    const { width, height } = this.getSize();
    this.renderer.setSize(width, height, false);
    this._camera = new PerspectiveCamera(60, width / height, 0.1, 10000);

    // 创建控制器
    this.controls = new CameraControls(this._camera, this.canvas);
    this.controls.minDistance = 1;
    this.controls.maxDistance = 5000;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.dollyToCursor = true;
    this.controls.draggingSmoothTime = 0.1;

    // 设置初始相机位置
    this.controls.setLookAt(50, 50, 50, 0, 0, 0, false);

    // 创建灯光
    const ambientLight = new AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(10, 20, 10);
    this.scene.add(directionalLight);

    // 创建网格
    this.gridHelper = new GridHelper(1000, 100, 0x444444, 0x222222);
    this.gridHelper.name = "ground";
    this.gridHelper.visible = this._showGrid;
    this.scene.add(this.gridHelper);

    this.startRenderLoop();
    this.setupResizeObserver();
  }

  get camera(): Camera {
    return this._camera;
  }

  get cameraMode(): CameraMode {
    return this._cameraMode;
  }

  get showGrid(): boolean {
    return this._showGrid;
  }

  set showGrid(value: boolean) {
    this._showGrid = value;
    this.gridHelper.visible = value;
  }

  /**
   * 切换相机模式
   */
  setCameraMode(mode: CameraMode): void {
    if (mode === this._cameraMode) return;

    const { width, height } = this.getSize();

    // 保存当前相机状态
    const position = this.controls.getPosition(new Vector3());
    const target = this.controls.getTarget(new Vector3());

    if (mode === "orthographic") {
      const frustumSize = 50;
      const aspect = width / height;
      const newCamera = new OrthographicCamera(
        -frustumSize * aspect,
        frustumSize * aspect,
        frustumSize,
        -frustumSize,
        0.1,
        10000
      );
      this._camera = newCamera;
    } else {
      const newCamera = new PerspectiveCamera(60, width / height, 0.1, 10000);
      this._camera = newCamera;
    }

    this._cameraMode = mode;

    // 更新控制器的相机并恢复位置
    this.controls.camera = this._camera;
    this.controls.setLookAt(
      position.x, position.y, position.z,
      target.x, target.y, target.z,
      false
    );
  }

  /**
   * 更新指针坐标（用于射线投射）
   */
  updatePointer(event: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * 执行射线投射
   */
  raycast(): Intersection | null {
    this.raycaster.setFromCamera(this.pointer, this._camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    return intersects.length > 0 ? intersects[0] : null;
  }

  /**
   * 更新指针并执行射线投射
   */
  raycastFromEvent(event: PointerEvent): RaycastResult | null {
    this.updatePointer(event);
    const intersection = this.raycast();
    if (!intersection) return null;

    const rect = this.canvas.getBoundingClientRect();
    return {
      intersection,
      position: {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      },
    };
  }

  /**
   * 聚焦到指定位置
   */
  fitTo(box: Box3, enableTransition = true): Promise<void> {
    return this.controls.fitToBox(box, enableTransition);
  }

  /**
   * 销毁渲染器
   */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    cancelAnimationFrame(this.animationId);
    this.resizeObserver?.disconnect();
    this.controls.dispose();
    this.renderer.dispose();
  }

  private getSize(): { width: number; height: number } {
    return {
      width: this.canvas.clientWidth,
      height: this.canvas.clientHeight,
    };
  }

  private startRenderLoop(): void {
    const animate = () => {
      if (this.disposed) return;
      this.animationId = requestAnimationFrame(animate);

      const delta = this.clock.getDelta();
      this.controls.update(delta);
      this.renderer.render(this.scene, this._camera);
    };
    animate();
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      if (this.disposed) return;

      const { width, height } = this.getSize();
      if (width === 0 || height === 0) return;

      if (this._camera instanceof PerspectiveCamera) {
        this._camera.aspect = width / height;
      } else if (this._camera instanceof OrthographicCamera) {
        const frustumSize = 50;
        const aspect = width / height;
        this._camera.left = -frustumSize * aspect;
        this._camera.right = frustumSize * aspect;
        this._camera.top = frustumSize;
        this._camera.bottom = -frustumSize;
      }
      this._camera.updateProjectionMatrix();
      this.renderer.setSize(width, height, false);
    });
    this.resizeObserver.observe(this.canvas);
  }
}
