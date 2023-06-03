import {
  CHViewBackfiller,
  ClickhouseSettings,
  PostgresSettings,
} from "./CHViewBackfiller";

export class ClickhouseLiveDataSyncer {
  constructor(
    private clickhouse_settings: ClickhouseSettings,
    private postgres_settings: PostgresSettings,
    private sync_settings: {
      minute_step: number;
      minute_tolerance: number;
    }
  ) {}

  backfiller() {
    const startTime = new Date(
      new Date().getTime() -
        this.sync_settings.minute_tolerance * 60 * 1000 -
        this.sync_settings.minute_step * 60 * 1000
    );
    return new CHViewBackfiller(
      this.clickhouse_settings,
      this.postgres_settings,
      {
        minute_step: this.sync_settings.minute_step,
        start_date: startTime,
        // 10 years in the future
        end_date: new Date(),
      }
    );
  }

  async run(): Promise<void> {
    while (true) {
      const backfiller = this.backfiller();
      console.log("Syncing data : ", new Date());
      await backfiller.runNext();
      await backfiller.deduplicate();
      await new Promise((resolve) =>
        setTimeout(resolve, this.sync_settings.minute_step * 60 * 1000)
      );
    }
  }
}
