import { generateID } from "./ids";
import { Recipe } from "./Recipe";

export class Machine {
  id: number;
  recipeID: number;
  progress: number;
  crafting: boolean;
  crafts: number;
  buffers: Map<string, number>;
  outputs: Map<string, number>;

  constructor(recipe: Recipe){
    this.id = generateID();
    this.recipeID = recipe.id;
    this.progress = 0;
    this.crafting = false;
    this.crafts = 0;
    this.buffers = new Map<string, number>();
    this.outputs = new Map<string, number>();
  }

  public addInput = (name: string, amount: number): void => {
    if (this.buffers.has(name)){
      this.buffers.set(name, this.buffers.get(name)! + amount);
    } else {
      this.buffers.set(name, amount);
    }
  }

  public canCraft = (recipe: Recipe): boolean => {
    if (this.crafting){
      return false;
    }

    if (recipe.ingredients.size === 0){
      return true;
    }

    let hasIngredients = true;
    for (const [ingredientName, ingredientAmount] of recipe.ingredients.entries()){
      if ((this.buffers.get(ingredientName) || 0) < ingredientAmount){
        hasIngredients = false;
        break;
      }
    }

    return hasIngredients;
  }

  public craft = (recipe: Recipe): void => {
    this.crafting = true;
    this.progress = 0;
    console.log(`Crafting ${recipe.name}`);
  }

  public update = (recipe: Recipe): void => {
    if (!this.crafting){
      if (this.canCraft(recipe)){
        this.craft(recipe);
      }
    }

    if (this.crafting){
      this.progress += 1000 / 60;

      if (this.progress >= recipe.craftTime){
        this.progress = 0;
        this.crafts++;
        this.crafting = false;
        recipe.outputs.forEach((amount, id) => {
          this.outputs.set(id, amount + recipe.outputs.get(id)!);
        });
        console.log(`Crafted ${recipe.name} (${JSON.stringify([...this.outputs.entries()])})`);
      }
    }
  }
}