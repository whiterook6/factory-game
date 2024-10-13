import { generateID } from "./ids";
import { Recipe } from "./Recipe";

const MAX_BUFFER_FOR_ALL_INGREDIENTS = 100;

export class Machine {
  static allMachines: Map<number, Machine> = new Map<number, Machine>();

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
    Machine.allMachines.set(this.id, this);
  }

  public addInput = (name: string, amount: number): void => {
    if (this.buffers.has(name)){
      this.buffers.set(name, this.buffers.get(name)! + amount);
    } else {
      this.buffers.set(name, amount);
    }
  }

  public fillInput = (name: string): number => {
    const capacity = this.getAvailableInputCapacity(name);
    this.buffers.set(name, MAX_BUFFER_FOR_ALL_INGREDIENTS);
    return capacity;
  }

  public addOutput = (name: string, amount: number): void => {
    if (this.outputs.has(name)){
      this.outputs.set(name, this.outputs.get(name)! + amount);
    } else {
      this.outputs.set(name, amount);
    }
  }

  public consumeOutput = (name: string, amount: number): number => {
    if (this.outputs.has(name)){
      const output = this.outputs.get(name)!;
      if (output >= amount){
        this.outputs.set(name, output - amount);
        return amount;
      } else {
        this.outputs.delete(name);
        return output;
      }
    } else {
      return 0;
    }
  }

  public consumeAllOutput = (name: string): number => {
    if (this.outputs.has(name)){
      const output = this.outputs.get(name)!;
      this.outputs.delete(name);
      return output;
    } else {
      return 0;
    }
  }

  public getAvailableInputCapacity = (name: string): number => {
    const recipe = Recipe.allRecipes.get(this.recipeID);
    if (!recipe){
      return 0;
    } else if (!recipe.ingredients.has(name)){
      return 0;
    } else if (this.buffers.has(name)){
      if (this.buffers.get(name)! >= MAX_BUFFER_FOR_ALL_INGREDIENTS){
        return 0;
      } else {
        return MAX_BUFFER_FOR_ALL_INGREDIENTS - this.buffers.get(name)!;
      }
    } else {
      return MAX_BUFFER_FOR_ALL_INGREDIENTS;
    }
  }

  public getAvailableInput = (name: string): number => {
    if (this.buffers.has(name)){
      return this.buffers.get(name)!;
    } else {
      return 0;
    }
  }

  public getAvailableOutput = (name: string): number => {
    if (this.outputs.has(name)){
      return this.outputs.get(name)!;
    } else {
      return 0;
    }
  }

  public canCraft = (): boolean => {
    if (this.crafting){
      return false;
    }

    const recipe = Recipe.allRecipes.get(this.recipeID)!;
    if (!recipe){
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

  public startCrafting = (): void => {
    this.crafting = true;
    this.progress = 0;
    const recipe = Recipe.allRecipes.get(this.recipeID)!;
    recipe.ingredients.forEach((amount, id) => {
      this.buffers.set(id, this.buffers.get(id)! - amount);
    });
  }

  public update = (dt: number): void => {
    if (!this.crafting){
      if (this.canCraft()){
        this.startCrafting();
      }
    }
    
    const recipe = Recipe.allRecipes.get(this.recipeID)!;
    if (this.crafting){
      this.progress += dt;

      if (this.progress >= recipe.craftTime){
        this.progress = 0;
        this.crafts++;
        this.crafting = false;
        recipe.outputs.forEach((amount, id) => {
          this.addOutput(id, amount);
        });
      }
    }
  }
}