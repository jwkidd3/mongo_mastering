| Feature                  | MongoDB                            | Cassandra                         | DynamoDB                          | Couchbase                         | Redis                              |
|--------------------------|-------------------------------------|------------------------------------|------------------------------------|-------------------------------------|-------------------------------------|
| **Type**                | Document Store                     | Wide-Column Store                 | Key-Value & Document Store        | Document & Key-Value Store         | In-Memory Key-Value Store          |
| **Data Format**         | BSON (Binary JSON)                 | Rows/Columns                      | JSON-like (internally key-value)  | JSON / Binary                      | Strings, Lists, Hashes, etc.       |
| **Query Language**      | MongoDB Query Language (MQL)       | Cassandra Query Language (CQL)    | PartiQL / API calls               | N1QL (SQL-like)                    | Redis CLI / Lua                    |
| **Schema**              | Flexible schema                    | Schema per column family          | Schema-less                       | Flexible schema                    | Schema-less                        |
| **Consistency Model**   | Tunable, Strong (Replica Sets)     | Tunable, Eventual by default      | Tunable, Eventually Consistent    | Tunable                           | Strong for single node             |
| **Horizontal Scaling**  | Sharding                           | Built-in partitioning             | Built-in auto-scaling             | Yes (with Sync Gateway)            | Manual with Redis Cluster          |
| **Replication**         | Replica Sets                       | Multi-node replication            | Global tables, multi-region       | Cross Data Center Replication      | Master-replica / Sentinel          |
| **Transactions**        | Multi-document ACID (since 4.0)    | Lightweight Transactions          | Limited transactions              | ACID (for documents)               | Atomic operations, LUA scripting   |
| **Use Case Fit**        | Web apps, CMS, Analytics           | IoT, Time-series, Logging         | Serverless, Mobile, E-commerce    | Offline-first apps, Real-time sync | Caching, Pub/Sub, Session Store    |
| **Performance Profile** | Balanced read/write, Index-heavy   | Write-optimized, linear scale     | Low-latency at scale              | Fast reads, mobile optimized       | Extremely fast (in-memory)         |
| **Hosting Options**     | Self-hosted, MongoDB Atlas         | Self-hosted, Astra                | Fully managed (AWS only)          | Self-hosted, Couchbase Capella     | Self-hosted, Redis Enterprise      |
| **License**             | SSPL (Server Side Public License)  | Apache 2.0                        | Proprietary (AWS managed)         | Apache 2.0 / Enterprise            | BSD / Commercial                   |

📝 Notes:
MongoDB is great for flexible JSON document storage and complex queries.

Cassandra shines with massive, globally distributed, high-write environments.

DynamoDB fits serverless and mobile use cases, tightly integrated with AWS.

Couchbase provides document storage with built-in mobile sync.

Redis is optimized for speed — ideal for caching, real-time analytics, and ephemeral data.


# NoSQL Database Comparison

| Feature                | MongoDB                            | Cassandra                         | DynamoDB                          | Couchbase                         | Redis                              |
|------------------------|-------------------------------------|------------------------------------|------------------------------------|-------------------------------------|-------------------------------------|
| **Type**              | Document Store                     | Wide-Column Store                 | Key-Value & Document Store        | Document & Key-Value Store         | In-Memory Key-Value Store          |
| **Data Format**       | BSON (Binary JSON)                 | Rows / Columns                    | JSON-like (via API)               | JSON / Binary                     | Strings, Hashes, Sets, Lists       |
| **Query Language**    | MQL (Mongo Query Language)         | CQL (SQL-like)                    | PartiQL / API                     | N1QL (SQL for JSON)                | Redis CLI / Lua Scripts            |
| **Schema**            | Flexible schema                    | Static per table                  | Schema-less                       | Flexible schema                    | Schema-less                        |
| **Consistency Model** | Tunable (Strong/Eventual)          | Tunable, Eventual by default      | Eventually Consistent (tunable)   | Tunable                           | Strong per operation               |
| **Scaling**           | Manual sharding                    | Native horizontal scaling         | Fully managed, auto-scaled        | Horizontal scaling with Sync       | Redis Cluster (manual)             |
| **Replication**       | Replica Sets                       | Multi-node replication            | Multi-region, Global Tables       | XDCR (Cross Data Center)           | Master-slave, Sentinel, Cluster    |
| **Transactions**      | ACID (multi-doc since v4.0)        | Limited (lightweight only)        | Limited                           | ACID per-document                  | Atomic commands, Lua scripts       |
| **Ideal Use Cases**   | CMS, Analytics, CRUD Apps          | Time-series, IoT, High Write      | Mobile apps, Serverless, E-comm   | Offline-first Apps, Mobile Sync    | Caching, Session Store, Queues     |
| **Performance**       | Balanced read/write, index-rich    | Write-heavy workloads             | Low-latency, highly scalable      | Fast sync, mobile-optimized        | Ultra-fast (in-memory)             |
| **Managed Hosting**   | MongoDB Atlas                      | DataStax Astra, self-hosted       | AWS DynamoDB                      | Couchbase Capella                  | Redis Enterprise / Cloud           |
| **License**           | SSPL (Server Side Public License)  | Apache 2.0                        | AWS proprietary                   | Apache 2.0 / Commercial            | BSD / Commercial                   |
