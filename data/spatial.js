// Find stores within 10km of a location
db.stores.find({
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [-118.2437, 34.0522] },
      $maxDistance: 10000
    }
  }
})