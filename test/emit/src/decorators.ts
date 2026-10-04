// Legacy decorators with emitDecoratorMetadata: the one feature that needs
// type information at emit time. A per-file emitter either reconstructs the
// types from the annotations it can see, or writes no metadata at all.
export type Applied = { kind: string; name: string };
export const applied: Applied[] = [];

function sealed(target: { name: string }): void {
  applied.push({ kind: "class", name: target.name });
}

function logged(_target: object, key: string): void {
  applied.push({ kind: "method", name: key });
}

function tracked(_target: object, key: string): void {
  applied.push({ kind: "property", name: key });
}

@sealed
export class Service {
  @tracked
  name: string = "svc";

  @logged
  run(input: string, times: number): boolean {
    return input.length > times;
  }
}
