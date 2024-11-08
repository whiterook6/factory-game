import { Framebuffer } from "@whiterook6/terminal-engine";

export type Cell = [number, number];

export enum Heading {
  LEFT = 0,
  RIGHT = 1,
  FORWARD = 2,
};

export type Segment = "║" | "═" | "╗" | "╝" | "╚" | "╔" | "╣" | "╠" | "╩" | "╦" | "╬";

export enum Direction {
  NORTH = 0,
  EAST = 1,
  SOUTH = 2,
  WEST = 3,
};

export type Pipe = [
  /** the X coordinate of the start */
  number,

  /** the Y coordinate of the start */
  number,

  /** the initial facing direction, facing down into the pipe */
  Direction,

  /** the turns or forwards until the end of the pipe */
  ...Heading[]
];

export type Network = Pipe[];

export const getNextCell = ([x, y]: Cell, direction: Direction ): Cell => {
  switch (direction){
    case Direction.NORTH:
      return [x, y - 1];
    case Direction.EAST:
      return [x + 1, y];
    case Direction.SOUTH:
      return [x, y + 1];
    case Direction.WEST:
      return [x - 1, y];
  }
}

/**
 * Given a current direction and a turn (left, right, or forward), what's the resulting direction?
 */
export const getNextDirection = (currentDirection: Direction, turn: Heading): Direction => {
  if (turn === Heading.FORWARD){
    return currentDirection;
  }

  switch (currentDirection){
    case Direction.NORTH:
      if (turn === Heading.LEFT){
        return Direction.WEST;
      } else {
        return Direction.EAST;
      }
    case Direction.EAST:
      if (turn === Heading.LEFT){
        return Direction.NORTH;
      } else {
        return Direction.SOUTH;
      }
    case Direction.SOUTH:
      if (turn === Heading.LEFT){
        return Direction.EAST;
      } else {
        return Direction.WEST;
      }
    case Direction.WEST:
    default:
      if (turn === Heading.LEFT){
        return Direction.SOUTH;
      } else {
        return Direction.NORTH;
      }
  }
}

export const getCells = (pipe: Pipe): Cell[] => {
  if (pipe.length < 4){
    return [
      [pipe[0], pipe[1]]
    ];
  }

  let currentDirection = pipe[2];
  let currentCell: Cell = [pipe[0], pipe[1]];
  return [
    currentCell,
    ...pipe.slice(3).map(turn => {
      const nextDirection = getNextDirection(currentDirection, turn);
      currentCell = getNextCell(currentCell, nextDirection);
      return currentCell as Cell;
    })
  ]
};

export const getPipeSegment = (direction: Direction, turn: Heading): Segment => {
  switch (turn){
    case Heading.FORWARD:
      switch (direction){
        case Direction.NORTH:
          case Direction.SOUTH:
          return "║";
        case Direction.EAST:
        case Direction.WEST:
          return "═";
      }
    case Heading.LEFT:
      switch (direction){
        case Direction.NORTH:
          return "╗";
        case Direction.EAST:
          return "╝";
        case Direction.SOUTH:
          return "╚";
        case Direction.WEST:
          return "╔";
      }
    case Heading.RIGHT:
    default:
      switch (direction){
        case Direction.NORTH:
          return "╔";
        case Direction.EAST:
          return "╗";
        case Direction.SOUTH:
          return "╝";
        case Direction.WEST:
        default:
          return "╚";
      }
  }
}



export class TestPipe {
  public testPipe: Pipe = [5, 5, Direction.EAST,
    Heading.FORWARD,
    Heading.FORWARD,
    Heading.FORWARD,
    Heading.FORWARD,
    Heading.FORWARD,
    Heading.FORWARD,
    Heading.LEFT,
    Heading.FORWARD,
    Heading.FORWARD,
    Heading.LEFT,
    Heading.FORWARD,
    Heading.FORWARD,
    Heading.FORWARD,
    Heading.LEFT,
    Heading.FORWARD,
    Heading.FORWARD,
    Heading.FORWARD,
    Heading.FORWARD,
    Heading.RIGHT,
    Heading.FORWARD,
    Heading.FORWARD,
  ];
  
  renderTo(framebuffer: Framebuffer){
    if (this.testPipe.length < 4){
      framebuffer.write(this.testPipe[0], this.testPipe[1], [
        [getPipeSegment(this.testPipe[2] /* direction */, Heading.FORWARD), 255, 255, 255, 0, 0, 0]            
      ]);
      return;
    }
    
    let currentCell: Cell = [this.testPipe[0], this.testPipe[1]];
    let currentDirection: Direction = this.testPipe[2];
    this.testPipe.slice(3).forEach(turn => {
      const segment = getPipeSegment(currentDirection, turn);
      framebuffer.write(currentCell[0], currentCell[1], [
        [segment, 255, 255, 255, 0, 0, 0]
      ]);
      currentDirection = getNextDirection(currentDirection, turn);
      currentCell = getNextCell(currentCell, currentDirection);
    });
  }
}