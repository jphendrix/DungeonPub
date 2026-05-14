const { TableClient } = require("@azure/data-tables");

module.exports = async function (context, req) {
  // 1. Validate connection string
  const conn = process.env.StorageConnString;
  if (!conn) {
    context.res = { status: 500, body: "Missing StorageConnString in app settings" };
    return;
  }

  // 2. Validate tableName query param
  const tableName = (req.query.tableName || "").trim().toLowerCase();
  if (!tableName) {
    context.res = { status: 400, body: "Missing required query param: tableName" };
    return;
  }

  const client = TableClient.fromConnectionString(conn, tableName);

  // 3. Create table if it doesn't exist (won't throw if it already exists)
  try {
    await client.createTable();
  } catch (err) {
    // 409 Conflict means the table already exists — that's fine
    if (err.statusCode !== 409) {
      context.log.error("Error creating table:", err);
      context.res = { status: 500, body: "Failed to connect to table storage" };
      return;
    }
  }

  const partitionKey = req.query.partitionKey || "items";
  const rowKey = req.body?.id ?? req.query.id;

  // 4. Handle GET — fetch a single entity or list all in partition
  if (req.method === "GET") {
    if (rowKey) {
      // Fetch a specific entity
      try {
        const entity = await client.getEntity(partitionKey, rowKey);
        context.res = { status: 200, body: entity };
      } catch (err) {
        if (err.statusCode === 404) {
          context.res = { status: 404, body: "Entity not found" };
        } else {
          context.log.error("GET error:", err);
          context.res = { status: 500, body: "Error fetching entity" };
        }
      }
    } else {
      // List all entities in the partition
      try {
        const entities = [];
        const iter = client.listEntities({
          queryOptions: { filter: `PartitionKey eq '${partitionKey}'` }
        });
        for await (const entity of iter) {
          entities.push(entity);
        }
        context.res = { status: 200, body: entities };
      } catch (err) {
        context.log.error("LIST error:", err);
        context.res = { status: 500, body: "Error listing entities" };
      }
    }
    return;
  }

  // 5. Handle POST — upsert an entity
  if (req.method === "POST") {
    if (!rowKey) {
      context.res = { status: 400, body: "Missing required field: id (used as rowKey)" };
      return;
    }
    try {
      const entity = {
        partitionKey,
        rowKey,
        ...req.body
      };
      await client.upsertEntity(entity, "Merge");
      context.res = { status: 200, body: { status: "saved", entity } };
    } catch (err) {
      context.log.error("POST error:", err);
      context.res = { status: 500, body: "Error saving entity" };
    }
    return;
  }

  // 6. Method not allowed
  context.res = { status: 405, body: "Method not allowed. Use GET or POST." };
}