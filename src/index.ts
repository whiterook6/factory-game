import { Recipe } from "./Recipe";
import { Machine } from "./Machine";
import { Connection } from "./Connection";
import ansi from "ansi";

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

const cursor = ansi(process.stdout);
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

  // output:
  cursor.buffer();
  cursor.goto(1, 1).eraseLine();

  // miners
  for (const miner of miners){
    miner.printState(cursor).reset().write(" ");
  }
  cursor.reset();
  minerToFurnaceConnection.printState(cursor).reset().write(" ");

  // furnaces
  for (const furnace of furnaces){
    furnace.printState(cursor).write(" ");
  }
  cursor.reset();
  furnaceToAssemblerConnection.printState(cursor).reset().write(" ");

  // assemblers
  for (const assembler of assemblers){
    assembler.printState(cursor).reset().write(" ");
  }
  cursor.flush();
}, 1000 / 60)