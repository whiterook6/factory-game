import { Framebuffer } from "./Framebuffer";

export abstract class Renderable {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(x: number, y: number, width: number, height: number){
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  abstract render(framebuffer: Framebuffer): void;
}