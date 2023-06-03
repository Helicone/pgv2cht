import {
  CHViewBackfiller,
  ClickhouseSettings,
  PostgresSettings,
} from "./CHViewBackfiller";

export class ClickhouseLiveDataSyncer {
  private lastSyncedDate: Date;
  constructor(
    private clickhouse_settings: ClickhouseSettings,
    private postgres_settings: PostgresSettings,
    private sync_settings: {
      minute_step: number;
      minute_tolerance: number;
    }
  ) {
    this.lastSyncedDate = new Date();
  }

  runStep() {
    const startTime = new Date(
      this.lastSyncedDate.getTime() -
        this.sync_settings.minute_tolerance * 60 * 1000
    );
    const endTime = new Date();
    this.lastSyncedDate = new Date(endTime.getTime());

    const backfiller = new CHViewBackfiller(
      this.clickhouse_settings,
      this.postgres_settings
    );
    backfiller.runRange(startTime, endTime);
  }

  async run(): Promise<void> {
    while (true) {
      this.runStep();
      await new Promise((resolve) =>
        setTimeout(resolve, this.sync_settings.minute_step * 60 * 1000)
      );
    }
  }
}
