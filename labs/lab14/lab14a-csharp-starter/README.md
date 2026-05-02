# Lab 14A Starter — C# / MongoDB.Driver

A ready-to-build console scaffold for Lab 14A. Connection wiring and project
structure are already in place; you fill in the model fields, service methods,
and CRUD calls.

## What's already done

- `MongoDBPolicyService.csproj` — targets `net8.0`, references `MongoDB.Driver` 2.28
  and `Microsoft.Extensions.Configuration` for `appsettings.json` loading.
- `appsettings.json` — connection string + database name. Override either via env
  vars `MongoDB__ConnectionString` / `MongoDB__DatabaseName`.
- `Services/MongoDBService.cs` — `MongoClient` setup, exposes typed
  `IMongoCollection<T>` for `Policies` and `Customers`. Don't change this.
- `Program.cs` — reads config, constructs services, wraps everything in a
  try/catch. Build runs cleanly out of the box.

## What you fill in

- `Models/Policy.cs` — add `[BsonElement]` properties (PolicyNumber, CustomerId,
  PolicyType, Premium, etc.). Skeleton class with `[BsonId]` is provided.
- `Models/Customer.cs` — add Customer + Address sub-document fields.
- `Services/PolicyService.cs` — implement the stub methods (Create, Read, Update,
  Delete, aggregation). Each currently returns a default; replace with calls to
  `_policies` (the `IMongoCollection<Policy>`).
- `Program.cs` — under the `TODO` block, add calls demonstrating CRUD operations.

## Run

```bash
dotnet build
dotnet run
```

The build must succeed before you change anything. The app will connect (assuming
MongoDB is up on `localhost:27017`) and exit. As you fill in TODOs, re-run to see
results.
