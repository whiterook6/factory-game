import { Recipe } from "./Recipe";
import { Machine } from "./Machine";
import { Connection } from "./Connection";
import ansi from "ansi";
import { Framebuffer, RGB, TOKEN } from "./Framebuffer";
import { Cell, manhattanCost, Pathfinder } from "./Pathfinder";
import { TestPipe } from "./Pipes";

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
  const framebuffer = new Framebuffer(terminalWidth, terminalHeight);

  const pipeTest = new TestPipe();

  setInterval(() => {
    framebuffer.clear();
    pipeTest.render(framebuffer);
    framebuffer.render(cursor);
  }, 1000 / 60);
};

run();