export class RenderQueueFullError extends Error {
  constructor() {
    super("Image renderer queue is full");
    this.name = "RenderQueueFullError";
  }
}

export class RenderQueue {
  private pending = 0;
  private tail: Promise<void> = Promise.resolve();

  constructor(private readonly maximumPending: number) {}

  get size(): number {
    return this.pending;
  }

  async run<T>(render: () => Promise<T>): Promise<T> {
    if (this.pending >= this.maximumPending) {
      throw new RenderQueueFullError();
    }

    this.pending++;
    const result = this.tail.then(render);
    this.tail = result.then(
      () => undefined,
      () => undefined
    );

    try {
      return await result;
    } finally {
      this.pending--;
    }
  }
}
