# NoSQL Database Comparison

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

## Notes

- **MongoDB** is great for flexible JSON document storage and complex queries.
- **Cassandra** shines with massive, globally distributed, high-write environments.
- **DynamoDB** fits serverless and mobile use cases, tightly integrated with AWS.
- **Couchbase** provides document storage with built-in mobile sync.
- **Redis** is optimized for speed — ideal for caching, real-time analytics, and ephemeral data.
