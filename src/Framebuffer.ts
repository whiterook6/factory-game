import ansi from "ansi";
import { overwriteArray, overwriteString } from "./helpers";

export type RGB = [number, number, number];
export type TOKEN = [
  /** The text to write */
  string,
  
  /** The text color red */
  number,
  
  /** The text color green */
  number,
  
  /** The text color blue */
  number,

  /** The background color red */
  number,

  /** The background color green */
  number,

  /** The background color blue */
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

  constructor(width: number, height: number) {
    if (width < 1 || height < 1){
      throw new Error("Framebuffer must have a width and height of at least 1");
    }

    this.width = width;
    this.height = height;
    
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

  public resize = (newWidth: number, newHeight: number) => {
    this.width = Math.max(newWidth, 1);
    this.height = Math.max(newHeight, 1);

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

  public write = (viewX: number, viewY: number, tokens: TOKEN[]) => {
    const floorViewX = Math.floor(viewX);
    const flootViewY = Math.floor(viewY);

    // if we're outside the view, skip
    const rowCount = this.buffer.length;
    if (flootViewY < 0 || flootViewY >= rowCount) {
      return;
    }

    const row = tokens.map(([text]) => text).join("");
    if (floorViewX + row.length < 0 || floorViewX >= this.buffer[0].length) {
      return;
    }

    const fgRow: RGB[] = tokens.flatMap((token) => {
      const [text, fgRed, fgGreen, fgBlue] = token;
      return Array(text.length).fill([fgRed, fgGreen, fgBlue]);
    });
    const bgRow: RGB[] = tokens.flatMap((token) => {
      const [text, fgRed, fgGreen, fgBlue, bgRed, bgGreen, bgBlue] = token;
      return Array(text.length).fill([bgRed, bgGreen, bgBlue]);
    });

    this.buffer[flootViewY] = overwriteString(this.buffer[flootViewY], row, floorViewX);
    this.fgBuffer[flootViewY] = overwriteArray<RGB>(this.fgBuffer[flootViewY], fgRow, floorViewX);
    this.bgBuffer[flootViewY] = overwriteArray<RGB>(this.bgBuffer[flootViewY], bgRow, floorViewX);
  };

  public getWidth = () => this.width;
  public getHeight = () => this.height;
};
