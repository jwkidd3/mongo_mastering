// Find insurance branches within 10km of a location (Los Angeles)
db.branches.find({
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [-118.2437, 34.0522] },
      $maxDistance: 10000
    }
  }
})

// Find insurance branches in a specific territory
db.branches.find({
  territory: "Southern California"
})

// Find branches that offer specific insurance specialties near a location
db.branches.find({
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [-122.4194, 37.7749] }, // San Francisco
      $maxDistance: 15000
    }
  },
  specialties: { $in: ["Auto", "Commercial"] }
})

// Find all branches within a circular region using $geoWithin
db.branches.find({
  location: {
    $geoWithin: {
      $centerSphere: [[-87.6298, 41.8781], 10 / 3963.2] // Chicago, 10 mile radius
    }
  }
})

// Find branches in a polygon area (e.g., a specific insurance coverage zone)
db.branches.find({
  location: {
    $geoWithin: {
      $geometry: {
        type: "Polygon",
        coordinates: [[
          [-74.0, 40.7], // Southwest corner (NYC area)
          [-74.0, 40.8], // Northwest corner
          [-73.9, 40.8], // Northeast corner
          [-73.9, 40.7], // Southeast corner
          [-74.0, 40.7]  // Close the polygon
        ]]
      }
    }
  }
})