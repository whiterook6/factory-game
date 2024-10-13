import { generateID } from "./ids";

export class Recipe {
  static allRecipes: Map<number, Recipe> = new Map<number, Recipe>();

  id: number;
  name: string;
  craftTime: number;
  ingredients: Map<string, number>;
  outputs: Map<string, number>;

  constructor(name: string, craftTime: number) {
    this.id = generateID();
    this.name = name;
    this.craftTime = craftTime;
    this.ingredients = new Map<string, number>();
    this.outputs = new Map<string, number>();
    Recipe.allRecipes.set(this.id, this);
  }

  public toString(){
    // print the recipe name, the ingredients, and the outputs, and the time it takes to craft
    const ingredientNames: string[] = [...this.ingredients.entries().map(([name]) => name)];
    const outputNames: string[] = [...this.outputs.entries().map(([name]) => name)];
    return `${this.name}: ${ingredientNames.join(", ")} -> ${this.craftTime.toFixed(1)}s -> ${outputNames.join(", ")}`;
  }
};