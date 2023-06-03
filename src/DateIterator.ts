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
    this.current_date = new Date(
      this.current_date.getTime() + this.minute_step * 60 * 1000
    );
    return this.current_date;
  }
  current(): Date {
    return this.current_date;
  }

  hasNext(): boolean {
    return this.current_date < this.end_date;
  }

  peakNext(): Date {
    return new Date(this.current_date.getTime() + this.minute_step * 60 * 1000);
  }
}
