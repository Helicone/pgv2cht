import {
  CHViewBackfiller,
  ClickhouseSettings,
  PostgresSettings,
} from "./CHViewBackfiller";
import { Config } from "./config";

type NotUndefined<T> = T extends undefined ? never : T;

export class ClickhouseLiveDataSyncer {
  private lastSyncedDate: Date;
  constructor(
    private clickhouse_settings: ClickhouseSettings,
    private postgres_settings: PostgresSettings,
    private sync_settings: NotUndefined<Config["sync_settings"]>
  ) {
    this.lastSyncedDate = new Date();
  }

  runStep() {
    const startTime = new Date(
      this.lastSyncedDate.getTime() -
        this.sync_settings.minute_tolerance * 60 * 1000 -
        this.sync_settings.minute_delay * 60 * 1000
    );
    const endTime = new Date(
      new Date().getTime() - this.sync_settings.minute_delay * 60 * 1000
    );
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
