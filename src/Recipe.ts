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
};