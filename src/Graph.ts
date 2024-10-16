import { Framebuffer } from "./Framebuffer";

export class Graph {
  vertexIDs: number[] = [];
  edgeIDs: [number, number][] = [];

  addVertex(vertexID: number) {
    if (!this.vertexIDs.includes(vertexID)) {
      this.vertexIDs.push(vertexID);
    }
  };

  removeVertex(vertexID: number) {
    this.vertexIDs = this.vertexIDs.filter(id => id !== vertexID);
    this.edgeIDs = this.edgeIDs.filter(([l, r]) => l !== vertexID && r !== vertexID);
  }

  addEdge([leftID, rightID]: [number, number]) {
    if (!this.vertexIDs.includes(leftID) || !this.vertexIDs.includes(rightID)) {
      throw new Error('Vertex not found');
    }
    if (this.edgeIDs.some(([l, r]) => l === leftID && r === rightID)) {
      throw new Error('Edge already exists');
    }
    this.edgeIDs.push([leftID, rightID]);
  }

  removeEdge([leftID, rightID]: [number, number]) {
    this.edgeIDs = this.edgeIDs.filter(([l, r]) => l !== leftID || r !== rightID);
  }

  render(framebuffer: Framebuffer){
    
  }
}