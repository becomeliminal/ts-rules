// JSX through a named factory, so nothing here needs a framework installed.
export type VNode = { tag: string; props: Record<string, unknown> | null; children: unknown[] };

declare global {
  namespace JSX {
    type Element = VNode;
    interface IntrinsicElements {
      [tag: string]: Record<string, unknown>;
    }
  }
}

export function h(tag: string, props: Record<string, unknown> | null, ...children: unknown[]): VNode {
  return { tag, props, children };
}

export const view: VNode = (
  <section id="a">
    <b>bold</b>text
  </section>
);
