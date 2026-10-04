// Class fields, where emitters have historically disagreed: whether a field
// declared without an initializer exists on the instance, and how parameter
// properties and private fields are written.
export class Account {
  balance = 0;
  note?: string;
  static opened = 0;
  readonly #secret = "s3";

  constructor(
    public readonly owner: string,
    private limit: number,
  ) {
    Account.opened++;
  }

  get secretLength(): number {
    return this.#secret.length;
  }

  canSpend(amount: number): boolean {
    return amount <= this.limit;
  }
}

export abstract class Shape {
  abstract area(): number;

  describe(): string {
    return `area ${this.area()}`;
  }
}

export class Square extends Shape {
  constructor(private side: number) {
    super();
  }

  area(): number {
    return this.side ** 2;
  }
}
