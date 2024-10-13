let nextID = 1;
export const generateID = () => nextID++;
const getID = (ids: Map<string, number>, name: string) => {
  if (!ids.has(name)) {
    const newID = generateID();
    ids.set(name, newID);
    return newID;
  } else {
    return ids.get(name);
  }
}

export const ingredientIDs = new Map<string, number>();
export const getIngredientID = (name: string) => getID(ingredientIDs, name);

export const recipeIDs = new Map<string, number>();
export const getRecipeID = (name: string) => getID(recipeIDs, name);