#### Project status

<i>This project started on June 2nd 2023, and is super alpha. You might experience bugs and undesired behavior! Please proceed with caution.</i>

# pgv2chtx

Postgres View -> Clickhouse Table ETL tool

## Why?

You have data on Postgres, but want to read that data in Clickhouse for the performance benefits.

# How to use this package...

### 1. In Clickhouse create your view like this

```sql
CREATE TABLE IF NOT EXISTS default.property_with_response_v1
(
    `response_id` Nullable(UUID),
    `response_created_at` Nullable(DateTime64),
    `latency` Nullable(Int64),
    `status` Nullable(Int64),
    `completion_tokens` Nullable(Int64),
    `prompt_tokens` Nullable(Int64),
    `model` Nullable(String),
    `request_id` UUID,
    `request_created_at` DateTime64,
    `auth_hash` String,
    `user_id` Nullable(String),
    `organization_id` UUID,
    `property_key` String,
    `property_value` String
)
ENGINE = MergeTree
PRIMARY KEY (organization_id, user_id, property_key, request_created_at, status, model, request_id)
ORDER BY (organization_id, user_id, property_key, request_created_at, status, model, request_id)
SETTINGS allow_nullable_key = TRUE;
```

### 2. Create a view in Postgres that map 1:1 to this Clickhouse table

Something like this:

```sql
CREATE OR REPLACE VIEW properties_with_response_ch_v1 as
select
     response.id as response_id,
     response.created_at as response_created_at,
     response.delay_ms as latency,
     response.status as status,
     response.completion_tokens as completion_tokens,
     response.prompt_tokens as prompt_tokens,
     response.body ->> 'model'::text as model,
     request.id as request_id,
     request.created_at as request_created_at,
     request.auth_hash as auth_hash,
     request.user_id as user_id,
     coalesce(request.helicone_org_id, get_org_id (request.id)) as organization_id,
     properties.key as property_key,
     properties.value as property_value
 from properties
 left join
    request ON request.id = properties.request_id
    left join response on response.request = request.id
```

<b>If you are using Supabase</b>
Run these commands

```sql
ALTER VIEW properties_with_response_ch_v1 OWNER TO postgres;
revoke all on properties_with_response_ch_v1 from anon;
revoke all on properties_with_response_ch_v1 from authenticated;
```

### 3. Setup Env

You need to setup your environment to connect to Clickhouse and postgres.

There is an example file `.env.example`

```bash
cp .env.example .env
```

then open `.env` and add your configuration.

### 4. Setup Config

Depending on the tables you want to sync you will need to change the config file to represent the tables and views both in Postgres and Clickhouse and any other settings to execute this migration.

### 5. Run the script

```bash
# This will run and sync the postgres view to the clickhouse table in real time
yarn start -- sync

# This will backfill the entire view to clickhouse in small time steps.
yarn start -- backfill
```
