import { Recipe } from "./Recipe";
import { Machine } from "./Machine";
import { Connection } from "./Connection";
import ansi from "ansi";
import { Framebuffer, RGB, TOKEN } from "./Framebuffer";
import { Cell, manhattanCost, Pathfinder } from "./Pathfinder";

const run = () => {
  const cursor = ansi(process.stdout);
  process.stdin.resume();
  let interval;

  process.on('SIGINT', function() {
    if (interval) {
      clearInterval(interval);
    }
    cursor.goto(0, 0).show().reset().bg.reset().eraseLine();
    process.exit();
  });
  cursor.hide();

  // get the size of the terminal
  const terminalWidth = process.stdout.columns;
  const terminalHeight = process.stdout.rows;
  const framebuffer = new Framebuffer({viewHeight: terminalHeight, viewWidth: terminalWidth});

  const source = {
    x: 10,
    y: 2,
    width: 20,
    height: 3,
  };
  // get the center of the right side of source
  const sourceNode: Cell = [
    source.x + source.width, Math.floor(source.y + source.height / 2),
  ];

  const destination = {
    x: 20,
    y: 8,
    width: 20,
    height: 3,
  };
  // get the middle of the left edge of the destination
  const destinationNode: Cell = [
    destination.x, Math.floor(destination.y + destination.height / 2),
  ];

  const pathfinder = new Pathfinder();
  const path = pathfinder.findPath(sourceNode, destinationNode, (from: Cell, to: Cell) => {
    if (to[0] === destinationNode[0] && to[1] === destinationNode[1]){
      return true;
    }
    for (const box of [source, destination]){
      const left = box.x;
      const right = box.x + box.width;
      const top = box.y;
      const bottom = box.y + box.height;
      if (to[0] >= left && to[0] <= right && to[1] >= top && to[1] <= bottom){
        return false;
      }
    }
    return true;
  }, manhattanCost);

  setInterval(() => {
    const dt = 60 / 1000;
    


    framebuffer.clear();
    // draw a box for source
    framebuffer.write({
      viewX: source.x,
      viewY: source.y
    }, [
      ["╔" + "═".repeat(source.width - 2) + "╗", 255, 255, 255, 0, 0, 0]
    ] as TOKEN[]);
    
    for (let y = source.y + 1; y < source.y + source.height - 1; y++){
      framebuffer.write({
        viewX: source.x,
        viewY: y
      }, [
        ["║" + " ".repeat(source.width - 2) + "║", 255, 255, 255, 0, 0, 0]
      ]);
    }
    framebuffer.write({
      viewX: source.x,
      viewY: source.y + source.height - 1
    }, [
      ["╚" + "═".repeat(source.width - 2) + "╝", 255, 255, 255, 0, 0, 0],
    ] as TOKEN[]);

    // draw a box for destination
    framebuffer.write({
      viewX: destination.x,
      viewY: destination.y
    }, [
      ["╔" + "═".repeat(destination.width - 2) + "╗", 255, 255, 255, 0, 0, 0]
    ] as TOKEN[]);
    
    for (let y = destination.y + 1; y < destination.y + destination.height - 1; y++){
      framebuffer.write({
        viewX: destination.x,
        viewY: y
      }, [
        ["║" + " ".repeat(destination.width - 2) + "║", 255, 255, 255, 0, 0, 0]
      ]);
    }
    framebuffer.write({
      viewX: destination.x,
      viewY: destination.y + destination.height - 1
    }, [
      ["╚" + "═".repeat(destination.width - 2) + "╝", 255, 255, 255, 0, 0, 0],
    ] as TOKEN[]);

    // draw a * for each cell in the path
    for (const cell of path){
      framebuffer.write({
        viewX: cell[0],
        viewY: cell[1],
      }, [
        ["*", 255, 255, 255, 0, 0, 0],
      ] as TOKEN[]);
    }

    framebuffer.render(cursor);
  }, 1000 / 60);
};

run();