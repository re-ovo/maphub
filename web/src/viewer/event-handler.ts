import type { ViewportRenderer } from "./viewport-renderer";

export class ViewerEventHandler {
  private readonly renderer: ViewportRenderer;
  private readonly canvas: HTMLCanvasElement;

  constructor(renderer: ViewportRenderer, canvas: HTMLCanvasElement) {
    this.renderer = renderer;
    this.canvas = canvas;
  }

  
}
