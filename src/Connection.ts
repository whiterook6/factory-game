import { generateID } from "./ids";
import { Machine } from "./Machine";
import { Framebuffer, RGB, TOKEN, ViewXY } from "./Framebuffer";

export class Connection {
  static allConnections: Map<number, Connection> = new Map<number, Connection>();
  id: number;
  ingredientName: string;

  /**
   * units per second
   */
  maxFlowRate: number;
  sourceMachineIDs: number[] = [];
  destinationMachineIDs: number[] = [];
  lastFlow: number = 0;

  constructor(ingredientName: string, maxFlowRate: number = 1){
    this.id = generateID();
    this.ingredientName = ingredientName;
    this.maxFlowRate = maxFlowRate;
    Connection.allConnections.set(this.id, this);
  }

  public addSource = (machine: Machine): void => {
    const machineID = machine.id;
    if (!this.sourceMachineIDs.includes(machineID)){
      this.sourceMachineIDs.push(machineID);
    }
  }

  public removeSource = (machine: Machine): void => {
    const machineID = machine.id;
    this.sourceMachineIDs = this.sourceMachineIDs.filter(id => id !== machineID);
  }

  public addDestination = (machine: Machine): void => {
    const machineID = machine.id;
    if (!this.destinationMachineIDs.includes(machineID)){
      this.destinationMachineIDs.push(machineID);
    }
  }

  public removeDestination = (machine: Machine): void => {
    const machineID = machine.id;
    this.destinationMachineIDs = this.destinationMachineIDs.filter(id => id !== machineID);
  }

  /**
   * Moves outputs from source machines to destination machines. It drains evenly from all source machines
   * until it reaches capacity or runs out of output. It fills evenly all destination machines until they are full
   * or runs out of input.
   */
  public update(dt: number): void {
    this.lastFlow = 0;
    if (this.sourceMachineIDs.length === 0 || this.destinationMachineIDs.length === 0){
      return;
    }

    const availableOutputByMachine = this.sourceMachineIDs.map(id => {
      const sourceMachine = Machine.allMachines.get(id)!;
      const availableOutput = sourceMachine.getAvailableOutput(this.ingredientName);
      return [sourceMachine, availableOutput] as [Machine, number];
    })
      .filter(([_, availableOutput]) => availableOutput > 0) // we only care about machines with output
      .sort((a, b) => a[1] - b[1]); // sort by available output ascending
    const totalAvailableOutput = availableOutputByMachine.reduce((acc, [_, availableOutput]) => acc + availableOutput, 0);

    const availableCapacityByMachine = this.destinationMachineIDs.map(id => {
      const destinationMachine = Machine.allMachines.get(id)!;
      const availableCapacity = destinationMachine.getAvailableInputCapacity(this.ingredientName);
      return [destinationMachine, availableCapacity] as [Machine, number];
    })
      .filter(([_, availableCapacity]) => availableCapacity > 0) // we only care about machines with capacity
      .sort((a, b) => a[1] - b[1]); // sort by available capacity ascending
    const totalAvailableCapacity = availableCapacityByMachine.reduce((acc, [_, availableCapacity]) => acc + availableCapacity, 0);

    const totalFlow = Math.min(this.maxFlowRate * dt, totalAvailableOutput, totalAvailableCapacity);
    if (totalFlow <= 0){
      return;
    }

    this.lastFlow = totalFlow / dt;

    // reduce all source machines, draining the least full first then the remaining until all output is consumed
    let remainingCapacity = totalFlow;
    let averageTransferAmount = remainingCapacity / availableOutputByMachine.length;
    availableOutputByMachine.forEach(([machine, availableOutput], index) => {
      if (availableOutput < averageTransferAmount){
        machine.consumeAllOutput(this.ingredientName);
        remainingCapacity -= availableOutput;
        const remainingMachines = availableOutputByMachine.length - index - 1;
        if (remainingMachines > 0){
          averageTransferAmount = remainingCapacity / remainingMachines;
        }
      } else {
        machine.consumeOutput(this.ingredientName, averageTransferAmount);
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

  public render(framebuffer: Framebuffer, viewXY: ViewXY): void {
    const label = "-->";
    const labelLength = label.length;
    const flowIndicatorWidth = Math.round((this.lastFlow / this.maxFlowRate) * labelLength);
    const greenLabel = label.slice(0, flowIndicatorWidth);
    const blackLabel = label.slice(flowIndicatorWidth);

    const fgColor: RGB = [255, 255, 255];
    const green: RGB = [0, 255, 0];
    const black: RGB = [0, 0, 0];
    framebuffer.write(viewXY, [
      [greenLabel, ...fgColor, ...green],
      [blackLabel, ...fgColor, ...black]
    ] as TOKEN[]);
  }
}