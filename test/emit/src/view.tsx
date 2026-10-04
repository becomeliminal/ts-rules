// JSX through a named factory, so nothing here needs a framework installed.
export type VNode = { tag: string; props: Record<string, unknown> | null; children: unknown[] };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- JSX is typed through this namespace; it has no module form
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
