import { RGB, XY } from "@whiterook6/terminal-engine/src/Types";
import { Machine } from "./Machine";
import { Framebuffer } from "@whiterook6/terminal-engine";
import { TOKEN } from "@whiterook6/terminal-engine/src/Framebuffer";

export class Connection {
  position: XY
  ingredientName: string;

  /**
   * units per second
   */
  maxFlowRate: number;
  sources: Machine[] = [];
  destinations: Machine[] = [];
  lastFlow: number = 0;

  constructor(ingredientName: string, maxFlowRate: number = 1, position: XY){
    this.position = position;
    this.ingredientName = ingredientName;
    this.maxFlowRate = maxFlowRate;
  }

  public addSource = (machine: Machine): void => {
    if (!this.sources.includes(machine)){
      this.sources.push(machine);
    }
  }

  public removeSource = (machine: Machine): void => {
    this.sources = this.sources.filter(source => source !== machine);
  }

  public addDestination = (machine: Machine): void => {
    if (!this.destinations.includes(machine)){
      this.destinations.push(machine);
    }
  }

  public removeDestination = (machine: Machine): void => {
    this.destinations = this.destinations.filter(destination => destination !== machine);
  }

  /**
   * Moves outputs from source machines to destination machines. It drains evenly from all source machines
   * until it reaches capacity or runs out of output. It fills evenly all destination machines until they are full
   * or runs out of input.
   */
  public update(dt: number): void {
    this.lastFlow = 0;
    if (this.sources.length === 0 || this.destinations.length === 0){
      return;
    }

    const availableOutputByMachine = this.sources.map(sourceMachine => {
      const availableOutput = sourceMachine.getAvailableOutput(this.ingredientName);
      return [sourceMachine, availableOutput] as [Machine, number];
    })
      .filter(([_, availableOutput]) => availableOutput > 0) // we only care about machines with output
      .sort((a, b) => a[1] - b[1]); // sort by available output ascending
    if (availableOutputByMachine.length === 0){
      return;
    }
    const totalAvailableOutput = availableOutputByMachine.reduce((acc, [_, availableOutput]) => acc + availableOutput, 0);

    const availableCapacityByMachine = this.destinations.map(destinationMachine => {
      const availableCapacity = destinationMachine.getAvailableInputCapacity(this.ingredientName);
      return [destinationMachine, availableCapacity] as [Machine, number];
    })
      .filter(([_, availableCapacity]) => availableCapacity > 0) // we only care about machines with capacity
      .sort((a, b) => a[1] - b[1]); // sort by available capacity ascending
    if (availableCapacityByMachine.length === 0){
      debugger;
      return;
    }
    const totalAvailableCapacity = availableCapacityByMachine.reduce((acc, [_, availableCapacity]) => acc + availableCapacity, 0);

    const totalFlow = Math.min(this.maxFlowRate * dt, totalAvailableOutput, totalAvailableCapacity);
    if (totalFlow <= 0){
      debugger;
      return;
    }

    this.lastFlow = totalFlow / dt;

    // reduce all source machines, draining the least full first then the remaining until all output is consumed
    let remainingCapacity = totalFlow;
    let averageTransferAmount = remainingCapacity / availableOutputByMachine.length;
    availableOutputByMachine.forEach(([machine, availableOutput], index) => {
      if (availableOutput < averageTransferAmount){
        machine.drainAllOutput(this.ingredientName);
        remainingCapacity -= availableOutput;
        const remainingMachines = availableOutputByMachine.length - index - 1;
        if (remainingMachines > 0){
          averageTransferAmount = remainingCapacity / remainingMachines;
        }
      } else {
        machine.drainOutput(this.ingredientName, averageTransferAmount);
      }
    });
    

    // fill all destination machines, filling the lowest first then spreading out the remainder
    let remainingOutput = totalFlow;
    averageTransferAmount = remainingCapacity / availableCapacityByMachine.length;
    availableCapacityByMachine.forEach(([machine, capacity], index) => {
      if (capacity < averageTransferAmount){
        machine.addInput(this.ingredientName, capacity);
        remainingOutput -= capacity;
        const remainingMachines = availableCapacityByMachine.length - index - 1;
        if (remainingMachines > 0){
          averageTransferAmount = remainingOutput / remainingMachines;
        }
      } else {
        machine.addInput(this.ingredientName, averageTransferAmount);
      }
    });
  }

  public renderTo(framebuffer: Framebuffer): void {
    const label = "-->";
    const labelLength = label.length;
    const flowIndicatorWidth = Math.round((this.lastFlow / this.maxFlowRate) * labelLength);
    const greenLabel = label.slice(0, flowIndicatorWidth);
    const blackLabel = label.slice(flowIndicatorWidth);

    const fgColor: RGB = [255, 255, 255];
    const green: RGB = [0, 255, 0];
    const black: RGB = [0, 0, 0];
    framebuffer.write(this.position[0], this.position[1], [
      [greenLabel, ...fgColor, ...green],
      [blackLabel, ...fgColor, ...black]
    ] as TOKEN[]);
  }
}