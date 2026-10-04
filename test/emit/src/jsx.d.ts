// What view.tsx's JSX type-checks against: the factory's nodes, any tag.
import type { VNode } from './view';

declare global {
  namespace JSX {
    type Element = VNode;
    interface IntrinsicElements {
      [tag: string]: Record<string, unknown>;
    }
  }
}
