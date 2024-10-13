import { Recipe } from "./Recipe";
import { Machine } from "./Machine";
import { Connection } from "./Connection";

const mineIronOre = new Recipe("Mine iron ore", 1.666);
mineIronOre.outputs.set("Iron ore", 1);

const smeltIronPlates = new Recipe("Smelt iron plates", 4.125);
smeltIronPlates.ingredients.set("Iron ore", 2);
smeltIronPlates.outputs.set("Iron plate", 1);

const miners = Array.from({ length: 2 }, () => new Machine(mineIronOre));
const furnaces = Array.from({ length: 8 }, () => new Machine(smeltIronPlates));
const connection = new Connection("Iron ore", 1);
miners.forEach(miner => connection.addSource(miner));
furnaces.forEach(furnace => connection.addDestination(furnace));

setInterval(() => {
  const dt = 60 / 1000;
  for (const miner of miners){
    miner.update(dt);
  }
  for (const furnace of furnaces){
    furnace.update(dt);
  }
  connection.update(dt);
  console.log("Miners with ore:", miners.map(miner => `${miner.id}: ${miner.getAvailableOutput("Iron ore").toFixed(2)}`).join(", "));
  console.log("Furnaces with ore:", furnaces.map(furnace => `${furnace.id}: ${furnace.getAvailableInput("Iron ore").toFixed(2)}`).join(", "));
  console.log("Furnaces with plates:", furnaces.map(furnace => `${furnace.id}: ${furnace.getAvailableOutput("Iron plate").toFixed(2)}`).join(", "));
}, 1000 / 60)