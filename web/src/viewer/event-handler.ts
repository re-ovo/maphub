import { Raycaster, Vector2 } from "three";
import type { ViewportRenderer } from "./viewport-renderer";

export class ViewerEventHandler {
  private readonly renderer: ViewportRenderer;
  private readonly canvas: HTMLCanvasElement;
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();

  constructor(renderer: ViewportRenderer, canvas: HTMLCanvasElement) {
    this.renderer = renderer;
    this.canvas = canvas;
  }
}
