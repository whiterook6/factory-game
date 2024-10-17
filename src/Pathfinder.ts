import Heap from 'heap';

/**
 * A cell in the grid. [X, Y], zero-indexed
 */
export type Cell = [number, number];

/**
 * Includes start and end cell. For a loop, the last cell should be the same as the first cell.
 */
export type Path = Cell[];

/**
 * A function to check whether a given cell is walkable or not.
 */
export type IsWalkableFN = (from: Cell, to: Cell) => boolean;

/**
 * A function to calculate the cost of moving from one cell to another.
 */
export type CostFN = (from: Cell, to: Cell) => number;
export const manhattanCost: CostFN = (from: Cell, to: Cell) => Math.abs(from[0] - to[0]) + Math.abs(from[1] - to[1]);
export const euclideanCost: CostFN = (from: Cell, to: Cell) => Math.sqrt(Math.pow(from[0] - to[0], 2) + Math.pow(from[1] - to[1], 2));


type FrontierNode = [
  number, // x
  number, // y
  number, // x of previous node
  number, // y of previous node
  number, // cost from start
  number, // cost to goal
];

export class Pathfinder {
  public findPath = (start: Cell, goal: Cell, isWalkable: IsWalkableFN, costFN: CostFN): Path => {
    const frontier = new Heap<FrontierNode>((a, b) => a[4] + a[5] - b[4] - b[5]);
    frontier.push(this.makeNode(start, start, 0, costFN(start, goal)));
    const visited: FrontierNode[] = [];

    // loop until we find the goal or run out of iterations
    const iterationLimit = 10_000;
    let iterations = 0;
    while (!frontier.empty() && iterations < iterationLimit){
      iterations++;

      // get the current node
      const current = frontier.pop();
      if (!current){
        break;
      } else if (current[0] === goal[0] && current[1] === goal[1]){
        break;
      }
      
      const alreadyVisited = visited.find((v) => v[0] === current[0] && v[1] === current[1]);
      if (alreadyVisited){
        continue;
      } else {
        visited.push(current);
      }
      
      const neighbors = this.getNeighbors(current, isWalkable);
      for (const neighbor of neighbors){
        const costFromStart = current[4] + costFN([current[0], current[1]], neighbor);
        const costToGoal = costFN(neighbor, goal);
        frontier.push(this.makeNode(neighbor, [current[0], current[1]], costFromStart, costToGoal));
      }
    }

    // Reconstruct path
    const path: Path = [];
    let current = visited.pop();
    while (current){
      path.unshift([current[0], current[1]]);
      if (current[0] === start[0] && current[1] === start[1]){
        break;
      } else if (current[0] === current[2] && current[1] === current[3]){
        break;
      }
      
      current = visited.find((v) => v[0] === current[2] && v[1] === current[3]);
    }

    frontier.clear();
    visited.length = 0;
    return path;
  }

  private getNeighbors = (node: FrontierNode, isWalkable: IsWalkableFN): Cell[] => {
    const [x, y, previousX, previousY] = node;

    return [
      // [x - 1, y - 1],
      [x, y - 1],
      // [x + 1, y - 1],
      [x - 1, y],
      [x + 1, y],
      // [x - 1, y + 1],
      [x, y + 1],
      // [x + 1, y + 1]
    ].filter((to: Cell) => {
      return isWalkable([x, y], to) && (to[0] !== previousX || to[1] !== previousY);
    }) as Cell[];
  }

  private makeNode = (cell: Cell, previous: Cell, costFromStart: number, costToGoal: number): FrontierNode => {
    return [
      cell[0],
      cell[1],
      previous[0],
      previous[1],
      costFromStart,
      costToGoal
    ];
  }
}