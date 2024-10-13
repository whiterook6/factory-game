import ansi from "ansi";
import { generateID } from "./ids";
import { Recipe } from "./Recipe";

const MAX_BUFFER_FOR_ALL_INGREDIENTS = 100;

export class Machine {
  static allMachines: Map<number, Machine> = new Map<number, Machine>();

  buffers: Map<string, number>;
  crafting: boolean;
  craftingSpeed: number;
  crafts: number;
  id: number;
  name: string;
  outputs: Map<string, number>;
  progress: number;
  recipeID: number;

  constructor(name: string, recipe: Recipe){
    this.buffers = new Map<string, number>();
    this.crafting = false;
    this.craftingSpeed = Math.random() * 0.1 + 0.95;
    this.crafts = 0;
    this.id = generateID();
    this.name = name;
    this.outputs = new Map<string, number>();
    this.progress = 0;
    this.recipeID = recipe.id;
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

      if (this.progress >= recipe.craftTime * this.craftingSpeed){
        this.progress = 0;
        this.crafts++;
        this.crafting = false;
        recipe.outputs.forEach((amount, id) => {
          this.addOutput(id, amount);
        });
      }
    }
  }

  public printState(cursor: ansi.Cursor): ansi.Cursor {
    // start with black background and machine name
    // slowly replace the background with the progress bar as it fills up
    // when it's crafting, drain the progress bar, different color
    
    const recipe = Recipe.allRecipes.get(this.recipeID);
    const label = this.name;
    const labelLength = label.length;
    if (this.crafting){
      const remaining = Math.round((1 - ((this.progress * this.craftingSpeed) / recipe.craftTime)) * labelLength);
      const nameStart = label.substring(0, remaining);
      const nameEnd = label.substring(remaining);
      cursor.white().bg.red().write(nameStart).bg.black().write(nameEnd);
    } else if (recipe){

      const ingredientNames = [...recipe.ingredients.keys()];
      const requiredIngredientsCount = ingredientNames.reduce((acc, key) => {
        const amount = recipe.ingredients.get(key)!;
        return acc + amount
      }, 0);
      const availableIngredientsCount = ingredientNames.reduce((acc, key) => {
        const amount = this.buffers.get(key) || 0;
        return acc + amount
      }, 0);
      const progress = Math.round(Math.min(1, availableIngredientsCount / requiredIngredientsCount) * labelLength);
      const nameStart = label.substring(0, progress);
      const nameEnd = label.substring(progress);
      cursor.white().bg.blue().write(nameStart).bg.black().write(nameEnd);
    } else {
      cursor.white().bg.black().write(label);
    }

    return cursor;
  }
}