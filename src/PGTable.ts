export class PGTableInCH {
  constructor(
    public postgres_url: string,
    public postgres_password: string,
    public source_table: string
  ) {}

  clickhouseTable(): string {
    return `postgresql('${this.postgres_url}', 'postgres', '${this.source_table}', 'postgres', '${this.postgres_password}')`;
  }
}
