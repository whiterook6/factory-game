import ansi from "ansi";
import { generateID } from "./ids";
import { Recipe } from "./Recipe";
import { Framebuffer, RGB, TOKEN, ViewXY } from "./Framebuffer";
import { Renderable } from "./Renderable";

const MAX_BUFFER_FOR_ALL_INGREDIENTS = 100;

export class Machine extends Renderable {
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
  state: "filling" | "crafting" | "draining" | "full";

  constructor(name: string, recipe: Recipe, x: number, y: number){
    super(x, y, name.length + 2, 1);
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

  /** 
   * @returns how much was used up
   */
  public addInput = (name: string, amount: number): number => {
    const recipe = Recipe.allRecipes.get(this.recipeID);
    
    if (!recipe){ // if there's no recipe, don't add anything
      return 0;
    } else if (!recipe.ingredients.has(name)){ // if the recipe doesn't use this ingredient, don't add it
      return 0;
    }

    const availableCapacity = this.getAvailableInputCapacity(name);
    if (availableCapacity < amount){ // if there's not enough space, fill it up and return the amount that was used
      this.buffers.set(name, MAX_BUFFER_FOR_ALL_INGREDIENTS);
      return availableCapacity;
    } else {
      this.buffers.set(name, this.buffers.get(name)! + amount);
      return amount;
    }
  }

  /**
   * @returns how much was used up
   */
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

  /**
   * @returns percentage complete of crafting, between 0 and 1.
   */
  public getCraftingProgress = (): number => {
    if (!this.crafting){
      return 0;
    }

    const recipe = Recipe.allRecipes.get(this.recipeID)!;
    if (!recipe){
      return 0;
    }

    return this.progress / (recipe.craftTime * this.craftingSpeed);
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
        this.state = "draining";
      } else {
        this.state = "crafting";
      }
    } else if ([...this.outputs.values()].some(amount => amount > 0)){
      this.state = "draining";
    } else {
      this.state = "filling";
    }
  }

  public render = (framebuffer: Framebuffer): void => {
    const viewXY: ViewXY = { viewX: this.x, viewY: this.y };
    const fgColor: [number, number, number] = [255, 255, 255];
    const label = this.name;
    const labelLength = label.length;
    const recipe = Recipe.allRecipes.get(this.recipeID);
    if (!recipe){
      framebuffer.write(viewXY, [[label, ...fgColor, 0, 0, 0]] as TOKEN[]);
      return;
    }

    let progress: number;
    let progressLabelWidth: number;
    let leftLabel: string;
    let rightLabel: string;

    switch (this.state){
      case "crafting": // green background
        progress = this.getCraftingProgress();
        progressLabelWidth = Math.round(labelLength * progress);
        leftLabel = label.substring(0, progressLabelWidth);
        rightLabel = label.substring(progressLabelWidth);

        return framebuffer.write(viewXY, [
          [leftLabel, ...fgColor, 0, 255, 0],
          [rightLabel, ...fgColor, 0, 0, 0]
        ] as TOKEN[]);
      case "filling": // blue background
        const bufferSize = [...this.buffers.values()].reduce((acc, val) => acc + val, 0);
        const ingredientTotal = [...recipe.ingredients.values()].reduce((acc, val) => acc + val, 0);
        progress = bufferSize / ingredientTotal;
        progressLabelWidth = Math.round(labelLength * progress);
        leftLabel = label.substring(0, progressLabelWidth);
        rightLabel = label.substring(progressLabelWidth);

        return framebuffer.write(viewXY, [
          [leftLabel, ...fgColor, 0, 0, 255],
          [rightLabel, ...fgColor, 0, 0, 0]
        ] as TOKEN[]);
      case "draining": // red background
        const outputSize = [...this.outputs.values()].reduce((acc, val) => acc + val, 0);
        const outputTotal = [...recipe.outputs.values()].reduce((acc, val) => acc + val, 0);
        progress = outputSize / outputTotal;
        progressLabelWidth = Math.round(labelLength * progress);
        leftLabel = label.substring(0, progressLabelWidth);
        rightLabel = label.substring(progressLabelWidth);

        return framebuffer.write(viewXY, [
          [leftLabel, ...fgColor, 255, 0, 0],
          [rightLabel, ...fgColor, 0, 0, 0]
        ] as TOKEN[]);
      default:
        return framebuffer.write(viewXY, [[label, ...fgColor, 0, 0, 0]] as TOKEN[]);
    };
  };
};
