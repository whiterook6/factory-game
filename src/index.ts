import { generateID, getIngredientID } from "./ids";
import { Recipe } from "./Recipe";
import { Machine } from "./Machine";

const mineIronOre = new Recipe("Mine iron ore", 1000);
mineIronOre.outputs.set("Iron ore", 1);

const smeltIronPlates = new Recipe("Smelt iron plates", 5000);
smeltIronPlates.ingredients.set("Iron ore", 2);
smeltIronPlates.outputs.set("Iron plate", 1);

const miner: Machine = new Machine(mineIronOre);
const furnace: Machine = new Machine(smeltIronPlates);

setInterval(() => {
  miner.update(mineIronOre);
  furnace.update(smeltIronPlates);
  const minerOre = miner.outputs.get("Iron ore") || 0;
  if (minerOre > 0){
    console.log(`Miner produced ${minerOre} iron ore`);
    furnace.addInput("Iron ore", minerOre);
    miner.outputs.set("Iron ore", 0);
  }
}, 1000 / 60)