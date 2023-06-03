import { ClickHouseClient, createClient } from "@clickhouse/client";

export class ClickhouseWrapper {
  private readonly client: ClickHouseClient;
  constructor({
    url,
    user,
    password,
  }: {
    url: string;
    user: string;
    password: string;
  }) {
    this.client = createClient({
      host: url,
      username: user,
      password,
    });
  }
  async dbExecute(query: string) {
    return await this.client.exec({
      query,
      clickhouse_settings: {
        wait_end_of_query: 1,
        async_insert: 1,
      },
    });
  }
}
