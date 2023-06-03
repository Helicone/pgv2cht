export class DateIterator {
  private current_date: Date;

  constructor(
    public minute_step: number,
    public start_date: Date,
    public end_date: Date
  ) {
    this.current_date = start_date;
  }

  next(): Date {
    if (!this.hasNext()) {
      throw new Error("DateIterator.next() called when hasNext() is false");
    }

    if (
      this.current_date.getTime() + this.minute_step * 60 * 1000 >
      this.end_date.getTime()
    ) {
      this.current_date = new Date(this.end_date);
      return this.current_date;
    }

    this.current_date = new Date(
      this.current_date.getTime() + this.minute_step * 60 * 1000
    );
    return this.current_date;
  }
  current(): Date {
    return this.current_date;
  }

  hasNext(): boolean {
    return this.current_date.getTime() < this.end_date.getTime();
  }

  peakNext(): Date {
    return new Date(this.current_date.getTime() + this.minute_step * 60 * 1000);
  }
}
