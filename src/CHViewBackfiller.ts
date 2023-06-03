import { ClickhouseWrapper } from "./CHClientWrapper";
import { DateIterator } from "./DateIterator";
import { PGTableInCH } from "./PGTable";
import moment from "moment";

export interface PostgresSettings {
  url: string;
  user: string;
  password: string;
  source_table: {
    table_name: string;
    date_column: string;
  };
}

export interface ClickhouseSettings {
  url: string;
  user: string;
  password: string;
  target_table: string;
  deduplication_command: string;
}

export class CHViewBackfiller {
  private readonly pgTable: PGTableInCH;
  private date_iterator: DateIterator;
  public clickhouse_client: ClickhouseWrapper;

  constructor(
    private clickhouse_settings: ClickhouseSettings,
    private postgres_settings: PostgresSettings,
    // Default is 1 month
    date_iterator_params?: {
      minute_step: number;
      start_date: Date;
      end_date: Date;
    }
  ) {
    this.pgTable = new PGTableInCH(
      postgres_settings.url,
      postgres_settings.password,
      postgres_settings.source_table.table_name
    );
    this.date_iterator = new DateIterator(
      date_iterator_params?.minute_step ?? 15,
      date_iterator_params?.start_date ??
        new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000),
      date_iterator_params?.end_date ?? new Date()
    );
    this.clickhouse_client = new ClickhouseWrapper(clickhouse_settings);
  }

  async deduplicate(): Promise<void> {
    this.clickhouse_client.dbExecute(
      this.clickhouse_settings.deduplication_command
    );
  }

  targetTable(): string {
    return this.clickhouse_settings.target_table;
  }

  dateColumn(): string {
    return this.postgres_settings.source_table.date_column;
  }

  getQuery(start: Date, end: Date): string {
    const startString = moment(start).format("YYYY-MM-DD HH:mm:ss");
    const endString = moment(end).format("YYYY-MM-DD HH:mm:ss");
    return `INSERT INTO ${this.targetTable()}
    SELECT *
    FROM ${this.pgTable.clickhouseTable()} as pg_table
    WHERE (
        pg_table.${this.dateColumn()} < toDateTime('${endString}', 'UTC')
        AND pg_table.${this.dateColumn()} >= toDateTime('${startString}', 'UTC')
    );`;
  }

  getNextQuery(): string {
    const start = this.date_iterator.current();
    const end = this.date_iterator.next();

    return this.getQuery(start, end);
  }

  async run(): Promise<void> {
    await this.runNext();

    if (this.date_iterator.hasNext()) {
      await this.run();
    } else {
      console.log("Finished");
    }
  }

  async runRange(start: Date, end: Date): Promise<void> {
    console.log("Running migration between", start, "and", end);
    const query = this.getQuery(start, end);
    const result = await this.clickhouse_client.dbExecute(query);
    console.log("Successfully ran migration, query id: ", result.query_id);
  }

  async runNext(): Promise<void> {
    console.log(
      "Running migration between",
      this.date_iterator.current(),
      "and",
      this.date_iterator.peakNext()
    );
    const query = this.getNextQuery();
    const result = await this.clickhouse_client.dbExecute(query);
    console.log("Successfully ran migration, query id: ", result.query_id);
  }

  peakNext(): Date {
    return this.date_iterator.peakNext();
  }
}
