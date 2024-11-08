import { Engine, Framebuffer } from "@whiterook6/terminal-engine";
import { Machine } from "./Machine";
import { Recipe } from "./Recipe";
import { Connection } from "./Connection";

const mineIron = new Recipe("Mine Iron", 3);
mineIron.outputs.set("Iron Ore", 1);

const smeltIronOre = new Recipe("Smelt Iron Ore", 5);
smeltIronOre.ingredients.set("Iron Ore", 1);
smeltIronOre.outputs.set("Iron Plate", 1);

const craftIronPlates = new Recipe("Craft Iron Gears", 2);
craftIronPlates.ingredients.set("Iron Plate", 2);
craftIronPlates.outputs.set("Iron Gear", 1);


const minerToFurnaceConnection = new Connection("Iron Ore", 2, [8, 2]);
const furnaceToAssemblerConnection = new Connection("Iron Plate", 2, [20, 2]);

const miners = Array(5).fill(undefined).map((_, index) => {
  const miner = new Machine("Miner", mineIron, 2, index + 2);
  minerToFurnaceConnection.addSource(miner);
  return miner;
});
const furnaces = Array(5).fill(undefined).map((_, index) => {
  const furnace = new Machine("Furnace", smeltIronOre, 12, index + 2);
  minerToFurnaceConnection.addDestination(furnace);
  furnaceToAssemblerConnection.addSource(furnace);
  return furnace;
});
const assemblers = Array(5).fill(undefined).map((_, index) => {
  const assembler = new Machine("Assembler", craftIronPlates, 24, index + 2);
  furnaceToAssemblerConnection.addDestination(assembler);
  return assembler;
});


const engine = new Engine();
engine.onUpdate((deltaTimeMS: number) => {
  miners.forEach(miner => miner.update(deltaTimeMS));
  furnaces.forEach(furnace => furnace.update(deltaTimeMS));
  assemblers.forEach(assembler => assembler.update(deltaTimeMS));
  minerToFurnaceConnection.update(deltaTimeMS);
  furnaceToAssemblerConnection.update(deltaTimeMS);
});
engine.onRender((framebuffer: Framebuffer) => {
  miners.forEach(miner => miner.renderTo(framebuffer));
  furnaces.forEach(furnace => furnace.renderTo(framebuffer));
  assemblers.forEach(assembler => assembler.renderTo(framebuffer));
  minerToFurnaceConnection.renderTo(framebuffer);
  furnaceToAssemblerConnection.renderTo(framebuffer);
});

engine.start();