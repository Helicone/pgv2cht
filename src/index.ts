import dotenv from "dotenv";
dotenv.config();
import yargs from "yargs";
import { CHViewBackfiller } from "./CHViewBackfiller";
import { ClickhouseLiveDataSyncer } from "./CHViewSyncer";
import { validateConfig } from "./config";

interface Env {
  CLICKHOUSE_URL: string;
  CLICKHOUSE_USER: string;
  CLICKHOUSE_PASSWORD: string;
  POSTGRES_URL: string;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
}

function getEnv(): Env {
  const env = process.env as any;
  const res = {
    CLICKHOUSE_URL: env.CLICKHOUSE_URL,
    CLICKHOUSE_USER: env.CLICKHOUSE_USER,
    CLICKHOUSE_PASSWORD: env.CLICKHOUSE_PASSWORD,
    POSTGRES_URL: env.POSTGRES_URL,
    POSTGRES_USER: env.POSTGRES_USER,
    POSTGRES_PASSWORD: env.POSTGRES_PASSWORD,
  };

  Object.entries(res).forEach(([key, value]) => {
    if (!value) {
      throw new Error(`Env ${key} is not set`);
    }
  });

  return res;
}

yargs.command({
  command: "backfill",
  describe: "Backfills data from postgres to clickhouse",
  builder: {
    "config-file": {
      type: "string",
      demandOption: true,
      describe: "Path to config file",
      default: "./config.json",
    },
  },
  handler: async function (argv) {
    const path = require("path");
    const absoluteConfigPath = path.resolve(
      __dirname,
      "..",
      argv["config-file"]
    );
    const config = validateConfig(require(absoluteConfigPath));
    const env = getEnv();
    if (!config.backfill_settings) {
      throw new Error("backfill_settings is not set");
    }

    const bf = new CHViewBackfiller(
      {
        deduplication_command: config.deduplication_query,
        password: env.CLICKHOUSE_PASSWORD,
        target_table: config.target_table,
        url: env.CLICKHOUSE_URL,
        user: env.CLICKHOUSE_USER,
      },
      {
        password: env.POSTGRES_PASSWORD,
        source_table: {
          date_column: config.source_date_column,
          table_name: config.source_view,
        },
        url: env.POSTGRES_URL,
        user: env.POSTGRES_USER,
      },
      {
        minute_step: config.backfill_settings.minute_step,
        end_date: config.backfill_settings.date_range.end_date,
        start_date: config.backfill_settings.date_range.start_date,
      }
    );

    await bf.run();
    await bf.deduplicate();
  },
});

yargs.command({
  command: "sync",
  describe: "Syncs data from postgres to clickhouse",
  builder: {
    "config-file": {
      type: "string",
      demandOption: true,
      describe: "Path to config file",
      default: "./config.json",
    },
  },
  handler: async function (argv) {
    const path = require("path");
    const absoluteConfigPath = path.resolve(
      __dirname,
      "..",
      argv["config-file"]
    );
    const config = validateConfig(require(absoluteConfigPath));
    const env = getEnv();

    if (!config.sync_settings) {
      throw new Error("sync_settings is not set");
    }
    const syncer = new ClickhouseLiveDataSyncer(
      {
        deduplication_command: config.deduplication_query,
        password: env.CLICKHOUSE_PASSWORD,
        target_table: config.target_table,
        url: env.CLICKHOUSE_URL,
        user: env.CLICKHOUSE_USER,
      },
      {
        password: env.POSTGRES_PASSWORD,
        source_table: {
          date_column: config.source_date_column,
          table_name: config.source_view,
        },
        url: env.POSTGRES_URL,
        user: env.POSTGRES_USER,
      },
      {
        ...config.sync_settings,
      }
    );
    await syncer.run();
  },
});

yargs.parse();
