export interface Config {
  target_table: string;
  source_view: string;
  source_date_column: string;
  deduplication_query: string;
  backfill_settings?: {
    date_range: {
      start_date: Date;
      end_date: Date;
    };
    minute_step: number;
  };
  sync_settings?: {
    minute_step: number;
    minute_tolerance: number;
    minute_delay: number;
  };
}

function validateBackFillConfig(config: any): Config["backfill_settings"] {
  if (!config["backfill-settings"]) {
    return undefined;
  }
  if (!config["backfill-settings"]["date-range"]) {
    throw new Error("backfill_settings.date_range is not set");
  }
  if (!config["backfill-settings"]["date-range"]["start"]) {
    throw new Error("backfill_settings.date_range.start is not set");
  }
  if (!config["backfill-settings"]["date-range"]["end"]) {
    throw new Error("backfill_settings.date_range.end is not set");
  }
  if (!config["backfill-settings"]["minute-step"]) {
    throw new Error("backfill_settings.minute_step is not set");
  }

  const startDate = new Date(
    config["backfill-settings"]["date-range"]["start"]
  );
  const endDate = new Date(config["backfill-settings"]["date-range"]["end"]);

  if (startDate > endDate) {
    throw new Error(
      "backfill_settings.date_range.start is after date_range.end"
    );
  }

  return {
    date_range: {
      start_date: startDate,
      end_date: endDate,
    },
    minute_step: config["backfill-settings"]["minute-step"],
  };
}

function validateSyncConfig(config: any): Config["sync_settings"] {
  if (!config["sync-settings"]) {
    return undefined;
  }
  if (!config["sync-settings"]["minute-step"]) {
    throw new Error("sync_settings.minute_step is not set");
  }
  if (!config["sync-settings"]["minute-tolerance"]) {
    throw new Error("sync_settings.minute_tolerance is not set");
  }

  if (!config["sync-settings"]["minute-delay"]) {
    throw new Error("sync_settings.minute_delay is not set");
  }

  return {
    minute_step: config["sync-settings"]["minute-step"],
    minute_tolerance: config["sync-settings"]["minute-tolerance"],
    minute_delay: config["sync-settings"]["minute-delay"],
  };
}

export function validateConfig(config: any): Config {
  if (!config["target-table"]) {
    throw new Error("target_table is not set");
  }
  if (!config["source-view"]) {
    throw new Error("source_view is not set");
  }
  if (!config["deduplication-query"]) {
    throw new Error("deduplication_query is not set");
  }
  if (!config["source-date-column"]) {
    throw new Error("source_date_column is not set");
  }

  return {
    target_table: config["target-table"],
    source_view: config["source-view"],
    deduplication_query: config["deduplication-query"],
    source_date_column: config["source-date-column"],
    backfill_settings: validateBackFillConfig(config),
    sync_settings: validateSyncConfig(config),
  };
}
