// Switch to your database
use ecommerce;

// Insert stores with geospatial data
db.stores.insertMany([
  {
    _id: 1,
    name: "Store 1",
    city: "Northfield",
    location: { type: "Point", coordinates: [-122.4194, 37.7749] },
    status: "active"
  },
  {
    _id: 2,
    name: "Store 2", 
    city: "Southwood",
    location: { type: "Point", coordinates: [-118.2437, 34.0522] },
    status: "active"
  },
  {
    _id: 3,
    name: "Store 3",
    city: "Eastville",
    location: { type: "Point", coordinates: [-87.6298, 41.8781] },
    status: "active"
  },
  {
    _id: 4,
    name: "Store 4",
    city: "Westburg",
    location: { type: "Point", coordinates: [-95.3698, 29.7604] },
    status: "active"
  },
  {
    _id: 5,
    name: "Store 5",
    city: "Newford",
    location: { type: "Point", coordinates: [-112.0740, 33.4484] },
    status: "active"
  },
  {
    _id: 6,
    name: "Store 6",
    city: "Oldport",
    location: { type: "Point", coordinates: [-75.1652, 39.9526] },
    status: "active"
  },
  {
    _id: 7,
    name: "Store 7",
    city: "Mountdale",
    location: { type: "Point", coordinates: [-117.1611, 32.7157] },
    status: "active"
  },
  {
    _id: 8,
    name: "Store 8",
    city: "Lakeridge",
    location: { type: "Point", coordinates: [-96.7970, 32.7767] },
    status: "active"
  },
  {
    _id: 9,
    name: "Store 9",
    city: "Oakvale",
    location: { type: "Point", coordinates: [-122.3321, 47.6062] },
    status: "active"
  },
  {
    _id: 10,
    name: "Store 10",
    city: "Pinetown",
    location: { type: "Point", coordinates: [-71.0589, 42.3601] },
    status: "active"
  },
  {
    _id: 11,
    name: "Store 11",
    city: "Elmfield",
    location: { type: "Point", coordinates: [-104.9903, 39.7392] },
    status: "active"
  },
  {
    _id: 12,
    name: "Store 12",
    city: "Cedarwood",
    location: { type: "Point", coordinates: [-80.1918, 25.7617] },
    status: "active"
  },
  {
    _id: 13,
    name: "Store 13",
    city: "Birchville",
    location: { type: "Point", coordinates: [-84.3880, 33.7490] },
    status: "active"
  },
  {
    _id: 14,
    name: "Store 14",
    city: "Willowburg",
    location: { type: "Point", coordinates: [-115.1398, 36.1699] },
    status: "active"
  },
  {
    _id: 15,
    name: "Store 15",
    city: "Mapletown",
    location: { type: "Point", coordinates: [-93.2650, 44.9778] },
    status: "active"
  },
  {
    _id: 16,
    name: "Store 16",
    city: "Hickorydale",
    location: { type: "Point", coordinates: [-90.0715, 35.2131] },
    status: "active"
  },
  {
    _id: 17,
    name: "Store 17",
    city: "Ashford",
    location: { type: "Point", coordinates: [-81.0912, 32.0835] },
    status: "active"
  },
  {
    _id: 18,
    name: "Store 18",
    city: "Walnutport",
    location: { type: "Point", coordinates: [-86.1581, 39.7684] },
    status: "active"
  },
  {
    _id: 19,
    name: "Store 19",
    city: "Chestnutridge",
    location: { type: "Point", coordinates: [-77.0369, 38.9072] },
    status: "active"
  },
  {
    _id: 20,
    name: "Store 20",
    city: "Poplarville",
    location: { type: "Point", coordinates: [-121.4944, 38.5816] },
    status: "active"
  }
]);

// Create geospatial index
db.stores.createIndex({ location: "2dsphere" });

// Verify insertion
print("Inserted", db.stores.countDocuments(), "stores");