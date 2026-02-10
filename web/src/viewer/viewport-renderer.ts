import CameraControls from "camera-controls";
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Box3,
  Clock,
  Color,
  DirectionalLight,
  EquirectangularReflectionMapping,
  Matrix4,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  Quaternion,
  Raycaster,
  Scene,
  Sphere,
  Spherical,
  SRGBColorSpace,
  Texture,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
  type Intersection,
} from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { ViewerEventHandler, type ViewerEventHandlerOptions } from "./event-handler";
import { useStore } from "@/store";
import { RenderLayer } from "./enums";

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
export type CameraMode = "perspective" | "orthographic";

export interface ViewportRendererOptions {
  canvas: HTMLCanvasElement;
  /** 事件处理器选项 */
  eventHandlerOptions?: ViewerEventHandlerOptions;
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
  readonly eventHandler: ViewerEventHandler;

  private _camera: Camera;
  private _cameraMode: CameraMode = "perspective";

  private readonly canvas: HTMLCanvasElement;
  private readonly clock = new Clock();

  private animationId = 0;
  private resizeObserver: ResizeObserver | null = null;
  private disposed = false;

  private envMap: Texture | null = null;
  private _showSky = true;

  constructor(options: ViewportRendererOptions) {
    this.canvas = options.canvas;

    // 创建渲染器
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(new Color(0x1a1a1a));

    // 创建场景
    this.scene = new Scene();

    // 创建相机
    const { width, height } = this.getSize();
    this.renderer.setSize(width, height, false);
    this._camera = new PerspectiveCamera(60, width / height, 0.1, 8000);
    this._camera.layers.enable(RenderLayer.Helper);

    // 创建控制器
    this.controls = new CameraControls(this._camera, this.canvas);
    this.controls.minDistance = 1;
    this.controls.maxDistance = 5000;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.dollyToCursor = true;
    this.controls.draggingSmoothTime = 0.1;

    // 左键平移，右键旋转
    this.controls.mouseButtons.left = CameraControls.ACTION.TRUCK;
    this.controls.mouseButtons.right = CameraControls.ACTION.ROTATE;

    // 设置初始相机位置
    this.controls.setLookAt(0, 50, 0, 0, 0, 0, false);

    // 创建灯光
    const ambientLight = new AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    this.loadSkyHDR();

    this.startRenderLoop();
    this.setupResizeObserver();
    this.initStoreSubscriptions();

    this.eventHandler = new ViewerEventHandler(this, this.canvas, options.eventHandlerOptions);
  }

  get camera(): Camera {
    return this._camera;
  }

  get cameraMode(): CameraMode {
    return this._cameraMode;
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
        10000,
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
      position.x,
      position.y,
      position.z,
      target.x,
      target.y,
      target.z,
      false,
    );
  }

  /**
   * 聚焦到指定位置
   */
  async fitTo(box: Object3D, enableTransition = true) {
    await this.controls.fitToBox(box, enableTransition);
  }

  setShowSky(show: boolean): void {
    this._showSky = show;
    if (this.envMap) {
      this.scene.background = show ? this.envMap : null;
      this.scene.environment = show ? this.envMap : null;
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    cancelAnimationFrame(this.animationId);
    this.resizeObserver?.disconnect();
    this.eventHandler?.dispose();
    this.controls.dispose();
    this.renderer.dispose();
    this.envMap?.dispose();
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
      this.renderer.render(this.scene, this._camera);
    });
    this.resizeObserver.observe(this.canvas);
  }

  private initStoreSubscriptions(): void {
    this.setShowSky(useStore.getState().showSky);
    useStore.subscribe((state, prevState) => {
      if (state.showSky !== prevState.showSky) {
        this.setShowSky(state.showSky);
      }
    });
  }

  private loadSkyHDR(): void {
    const loader = new RGBELoader();
    loader.load(
      "/hdr/puresky.hdr",
      (texture) => {
        if (this.disposed) {
          texture.dispose();
          return;
        }
        texture.mapping = EquirectangularReflectionMapping;
        this.envMap = texture;
        if (this._showSky) {
          this.scene.background = texture;
          this.scene.environment = texture;
        }
      },
      undefined,
      (error) => {
        console.error("Failed to load sky HDR:", error);
      },
    );
  }
}
