import { square } from "./square";
import type { Shape } from "./shape";

export function area(shape: Shape): number {
  return square(shape.side);
}
