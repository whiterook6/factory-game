import { Framebuffer, Types } from "@whiterook6/terminal-engine";
import { TOKEN } from "@whiterook6/terminal-engine/src/Framebuffer";
import { generateID } from "./ids";
import { Recipe } from "./Recipe";

const MAX_BUFFER_FOR_ALL_INGREDIENTS = 100;
export enum MachineState {
  crafting,
  draining,
  filling,
  blocked,
  empty,
}

export class Machine {
  position: Types.XY;
  inputBuffers: Map<string, number>;
  crafting: boolean;
  craftingSpeed: number;
  crafts: number;
  id: number;
  name: string;
  outputBuffers: Map<string, number>;
  progress: number;
  recipe: Recipe;

  constructor(name: string, recipe: Recipe, x: number, y: number){
    this.position = [x, y];
    this.inputBuffers = new Map<string, number>();
    this.crafting = false;
    this.craftingSpeed = Math.random() * 0.1 + 0.95;
    this.crafts = 0;
    this.id = generateID();
    this.name = name;
    this.outputBuffers = new Map<string, number>();
    this.progress = 0;
    this.recipe = recipe;
  }

  /** 
   * @returns how much was used up. If you give it 100 units and there was only 20 room, this returns 20.
   */
  public addInput = (name: string, amount: number): number => {
    const availableCapacity = this.getAvailableInputCapacity(name);

    // if there's not enough space, fill it up and return the amount that was used
    if (availableCapacity < amount){
      this.inputBuffers.set(name, MAX_BUFFER_FOR_ALL_INGREDIENTS);
      return availableCapacity;

    // if there's already some, but there's still room for more
    } else if (this.inputBuffers.has(name)){
      this.inputBuffers.set(name, this.inputBuffers.get(name) + amount);
      return amount;
    
    // if there's none yet
    } else {
      this.inputBuffers.set(name, amount);
      return amount;
    }
  }

  /**
   * @returns how much was filled, if any
   */
  public fillInput = (name: string): number => {
    const capacity = this.getAvailableInputCapacity(name);
    this.inputBuffers.set(name, MAX_BUFFER_FOR_ALL_INGREDIENTS);
    return capacity;
  }

  /**
   * @returns how much was consumed, if any
   */
  public consumeInput = (name: string, amount: number): number => {
    const availableInput = this.getAvailableInput(name);
    if (availableInput >= amount){
      this.inputBuffers.set(name, availableInput - amount);
      return amount;
    } else {
      this.inputBuffers.delete(name);
      return availableInput;
    }
  }

  /**
   * @returns how much output was added, if any
   */
  public addOutput = (name: string, maxAmount: number): number => {
    const capacity = Math.max(0, MAX_BUFFER_FOR_ALL_INGREDIENTS - this.getAvailableOutput(name));

    // if there's still room to add to this output, add it all and return the same amount
    if (capacity > maxAmount){
      this.outputBuffers.set(name, this.outputBuffers.get(name)! + maxAmount);
      return maxAmount;
    
    // if there's no enough room to add all of it, add as much as possible and return that amount
    } else {
      this.outputBuffers.set(name, MAX_BUFFER_FOR_ALL_INGREDIENTS);
      return capacity;
    }
  }

  /**
   * Take output from the machine, up to a certain amount.
   * @returns how much was consumed, if any
   */
  public drainOutput = (name: string, maxAmount: number): number => {
    const availableOutput = this.getAvailableOutput(name);
    if (availableOutput >= maxAmount){
      this.outputBuffers.set(name, availableOutput - maxAmount);
      return maxAmount;
    } else {
      this.outputBuffers.delete(name);
      return availableOutput;
    }
  }

  /**
   * @returns how much was drained, if any
   */
  public drainAllOutput = (name: string): number => {
    if (this.outputBuffers.has(name)){
      const output = this.outputBuffers.get(name)!;
      this.outputBuffers.delete(name);
      return output;
    } else {
      return 0;
    }
  }

  /**
   * @returns how much room there is to add input, given the current amount
   */
  public getAvailableInputCapacity = (name: string): number => {
    if (!this.recipe.ingredients.has(name)){
      return 0;
    }
    
    const currentAmount = this.getAvailableInput(name);
    if (currentAmount < MAX_BUFFER_FOR_ALL_INGREDIENTS){
      return MAX_BUFFER_FOR_ALL_INGREDIENTS - currentAmount;
    } else {
      return 0;
    }
  }

  /**
   * @returns how much of an ingredient is available for crafting
   */
  public getAvailableInput = (name: string): number => {
    if (this.inputBuffers.has(name)){
      return this.inputBuffers.get(name)!;
    } else {
      return 0;
    }
  }

  /**
   * @returns how much output is sitting waiting to be drained
   */
  public getAvailableOutput = (name: string): number => {
    if (this.outputBuffers.has(name)){
      return this.outputBuffers.get(name)!;
    } else {
      return 0;
    }
  }

  /**
   * @returns "percentage" complete of crafting, between 0 and 1.
   */
  public getCraftingProgress = (): number => {
    if (!this.crafting || this.craftingSpeed === 0 || this.recipe.craftTime === 0){
      return 0;
    }

    return this.progress / (this.recipe.craftTime * this.craftingSpeed);
  }

  public canCraft = (): boolean => {
    if (this.crafting){
      return false;
    }
    
    if (this.recipe.ingredients.size === 0){
      return true;
    }

    // if any of the required ingredients is in short supply, return false
    for (const [ingredientName, requiredAmount] of this.recipe.ingredients.entries()){
      const availableAmount = this.getAvailableInput(ingredientName);
      if (availableAmount < requiredAmount){
        return false;
      }
    }

    return true;
  }

  public startCrafting = (): void => {
    this.crafting = true;
    this.progress = 0;
    this.recipe.ingredients.forEach((amount, id) => {
      this.consumeInput(id, amount);
    });
  }

  public update = (deltaTimeMS: number): void => {
    if (!this.crafting && this.canCraft()){
      this.startCrafting();
    }
    
    if (this.crafting){
      this.progress += deltaTimeMS / 1000;

      // TODO: pause at the end in case there's no room for output
      if (this.progress >= this.recipe.craftTime * this.craftingSpeed){
        this.progress = 0;
        this.crafts++;
        this.crafting = false;
        this.recipe.outputs.forEach((amount, id) => {
          this.addOutput(id, amount);
        });
      }
    }
  }

  public renderTo = (framebuffer: Framebuffer): void => {
    const fgColor: [number, number, number] = [255, 255, 255];
    const label = this.name;
    const labelLength = label.length;

    let progress: number;
    let progressLabelWidth: number;
    let leftLabel: string;
    let rightLabel: string;

    switch (this.getState()){
      case "crafting": // green background
        progress = this.getCraftingProgress();
        progressLabelWidth = Math.round(labelLength * progress);
        leftLabel = label.substring(0, progressLabelWidth);
        rightLabel = label.substring(progressLabelWidth);

        return framebuffer.write(this.position[0], this.position[1], [
          [leftLabel, ...fgColor, 0, 255, 0],
          [rightLabel, ...fgColor, 0, 0, 0]
        ] as TOKEN[]);
      case "filling": // blue background
        const bufferSize = [...this.inputBuffers.values()].reduce((acc, val) => acc + val, 0);
        const ingredientTotal = [...this.recipe.ingredients.values()].reduce((acc, val) => acc + val, 0);
        progress = bufferSize / ingredientTotal;
        progressLabelWidth = Math.round(labelLength * progress);
        leftLabel = label.substring(0, progressLabelWidth);
        rightLabel = label.substring(progressLabelWidth);

        return framebuffer.write(this.position[0], this.position[1], [
          [leftLabel, ...fgColor, 0, 0, 255],
          [rightLabel, ...fgColor, 0, 0, 0]
        ] as TOKEN[]);
      case "draining": // red background
        const outputSize = [...this.outputBuffers.values()].reduce((acc, val) => acc + val, 0);
        const outputTotal = [...this.recipe.outputs.values()].reduce((acc, val) => acc + val, 0);
        progress = outputSize / outputTotal;
        progressLabelWidth = Math.round(labelLength * progress);
        leftLabel = label.substring(0, progressLabelWidth);
        rightLabel = label.substring(progressLabelWidth);

        return framebuffer.write(this.position[0], this.position[1], [
          [leftLabel, ...fgColor, 255, 0, 0],
          [rightLabel, ...fgColor, 0, 0, 0]
        ] as TOKEN[]);
      default:
        return framebuffer.write(this.position[0], this.position[1], [[label, ...fgColor, 0, 0, 0]] as TOKEN[]);
    };
  };

  private getState = (): string => {
    if (this.crafting){
      return "crafting";
    }

    const outputKeys = [...this.outputBuffers.keys()];
    const isOutputFull = outputKeys.every(outputName => {
      return this.outputBuffers.get(outputName)! >= MAX_BUFFER_FOR_ALL_INGREDIENTS;
    });
    if (isOutputFull){
      return "blocked";
    }

    const isOutputDraining = outputKeys.some(outputName => {
      return this.outputBuffers.get(outputName)! > 0;
    });
    if (isOutputDraining){
      return "draining";
    }

    const inputKeys = [...this.inputBuffers.keys()];
    const hasInputs = inputKeys.some(inputName => {
      return this.inputBuffers.get(inputName)! > 0;
    });

    if (hasInputs){
      return "filling";
    }

    return "empty";
  }
};
