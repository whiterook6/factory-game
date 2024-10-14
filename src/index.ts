import { Recipe } from "./Recipe";
import { Machine } from "./Machine";
import { Connection } from "./Connection";
import ansi from "ansi";
import { Framebuffer, RGB, TOKEN } from "./Framebuffer";

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

  const mineIronOre = new Recipe("Mine iron ore", 1.666);
  mineIronOre.outputs.set("Iron ore", 1);

  const smeltIronPlates = new Recipe("Smelt iron plates", 4.125);
  smeltIronPlates.ingredients.set("Iron ore", 2);
  smeltIronPlates.outputs.set("Iron plate", 1);

  const makeIronGears = new Recipe("Make iron gears", 0.5);
  makeIronGears.ingredients.set("Iron plate", 2);
  makeIronGears.outputs.set("Iron gear", 1);

  const miners = Array.from({ length: 2 }, () => new Machine("Miner", mineIronOre));
  const furnaces = Array.from({ length: 6 }, () => new Machine("Furnace", smeltIronPlates));
  const assemblers = Array.from({ length: 4 }, () => new Machine("Assembler", makeIronGears));

  const minerToFurnaceConnection = new Connection("Iron ore", 1);
  miners.forEach(miner => minerToFurnaceConnection.addSource(miner));
  furnaces.forEach(furnace => minerToFurnaceConnection.addDestination(furnace));

  const furnaceToAssemblerConnection = new Connection("Iron plate", 3);
  furnaces.forEach(furnace => furnaceToAssemblerConnection.addSource(furnace));
  assemblers.forEach(assembler => furnaceToAssemblerConnection.addDestination(assembler));

  setInterval(() => {
    const dt = 60 / 1000;
    for (const miner of miners){
      miner.update(dt);
    }
    for (const furnace of furnaces){
      furnace.update(dt);
    }
    for (const assembler of assemblers){
      assembler.update(dt);
    }
    minerToFurnaceConnection.update(dt);
    furnaceToAssemblerConnection.update(dt);

    framebuffer.clear();
    framebuffer.write({viewX: 0, viewY: 0}, [["Miners:", 255, 255, 255, 0, 0, 0]] as TOKEN[]);
    miners.forEach((miner, index) => {
      miner.render(framebuffer, {
        viewX: 0,
        viewY: index + 1
      });
    });
    minerToFurnaceConnection.render(framebuffer, {
      viewX: 1,
      viewY: 10
    });
    framebuffer.render(cursor);
  }, 1000 / 60);
};

run();