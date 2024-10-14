import ansi from "ansi";
import { overwriteArray, overwriteString } from "./helpers";

export type RGB = [number, number, number];
export type ViewSize = { viewWidth: number, viewHeight: number };
export type ViewXY = { viewX: number, viewY: number };

export type TOKEN = [
  /** The text to write */
  string,
  
  /** The text color red*/
  number,
  
  /** The text color green*/
  number,
  
  /** The text color blue*/
  number
];

export class Framebuffer {
  private width: number;
  private height: number;
  private buffer: string[];
  private fgBuffer: RGB[][];
  private bgBuffer: RGB[][];
  private emptyRow: string;
  private emptyFGRow: RGB[];
  private emptyBGRow: RGB[];

  constructor(size: ViewSize) {
    this.width = size.viewWidth;
    this.height = size.viewHeight;
    
    this.emptyRow = " ".repeat(this.width);
    this.emptyFGRow = Array(this.width).fill([255, 255, 255]);
    this.emptyBGRow = Array(this.width).fill([0, 0, 0]);

    this.buffer = Array(this.height).fill(this.emptyRow);
    this.fgBuffer = Array(this.height).fill(this.emptyFGRow);
    this.bgBuffer = Array(this.height).fill(this.emptyBGRow);
  }

  public clear = () => {
    this.buffer.fill(this.emptyRow);
    this.fgBuffer.fill(this.emptyFGRow);
    this.bgBuffer.fill(this.emptyBGRow);
  }
  
  public render = (cursor: ansi.Cursor) => {
    cursor.buffer();
    cursor.goto(1, 1);
    cursor.fg.rgb(...this.fgBuffer[0][0]);
    cursor.bg.rgb(...this.bgBuffer[0][0]);
    let previousFG = this.fgBuffer[0][0];
    let previousBG = this.bgBuffer[0][0];
    for (let j = 0; j < this.buffer.length; j++) {
      // for each row
      for (let i = 0; i < this.buffer[j].length; i++) {
        // for each character
        if (this.fgBuffer[j][i] !== previousFG) {
          cursor.fg.rgb(...this.fgBuffer[j][i]);
          previousFG = this.fgBuffer[j][i];
        }
        if (this.bgBuffer[j][i] !== previousBG) {
          cursor.bg.rgb(...this.bgBuffer[j][i] as RGB);
          previousBG = this.bgBuffer[j][i];
        }
        cursor.write(this.buffer[j][i]);
      }
    }
    cursor.flush();
  };

  public resize = (newSize: ViewSize) => {
    this.width = Math.max(newSize.viewWidth, 1);
    this.height = Math.max(newSize.viewHeight, 1);

    this.emptyRow = " ".repeat(this.width);
    this.buffer.length = this.height;
    this.buffer.fill(this.emptyRow);

    this.emptyFGRow = Array(this.width).fill([255, 255, 255]);
    this.fgBuffer.length = this.height;
    this.fgBuffer.fill(this.emptyFGRow);

    this.emptyBGRow = Array(this.width).fill([0, 0, 0]);
    this.bgBuffer.length = this.height;
    this.bgBuffer.fill(this.emptyBGRow);
  };

  public write = (viewXY: ViewXY, tokens: TOKEN[]) => {
    const viewX = Math.floor(viewXY.viewX);
    const viewY = Math.floor(viewXY.viewY);

    // if we're outside the view, skip
    const rowCount = this.buffer.length;
    if (viewY < 0 || viewY >= rowCount) {
      return;
    }

    const row = tokens.map(([text]) => text).join("");
    if (viewX + row.length < 0 || viewX >= this.buffer[0].length) {
      return;
    }

    const fgRow: RGB[] = tokens.flatMap((token) => {
      const [text, ...fg] = token;
      return Array(text.length).fill(fg);
    });

    this.buffer[viewY] = overwriteString(this.buffer[viewY], row, viewX);
    this.fgBuffer[viewY] = overwriteArray<RGB>(this.fgBuffer[viewY], fgRow, viewX);
  };

  public writeBackground = (viewXY: ViewXY, colors: RGB[]) => {
    const viewX = Math.floor(viewXY.viewX);
    const viewY = Math.floor(viewXY.viewY);

    // if we're outside the view, skip
    const rowCount = this.buffer.length;
    if (viewY < 0 || viewY >= rowCount) {
      return;
    }

    if (viewX + colors.length < 0 || viewX >= this.buffer[0].length) {
      return;
    }

    const bgRow = Array(colors.length).fill(colors);
    this.bgBuffer[viewY] = overwriteArray<RGB>(this.bgBuffer[viewY], bgRow, viewX);
    return;
  }

  public getWidth = () => this.width;
  public getHeight = () => this.height;
};
