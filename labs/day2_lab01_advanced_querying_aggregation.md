# Lab 1: Advanced Querying and Aggregation Framework (45 minutes)

## Learning Objectives
- Master complex query operations using MongoDB operators
- Build aggregation pipelines for data analysis
- Understand performance implications of different query patterns

## Prerequisites
- Sample e-commerce database with collections: `products`, `orders`, `customers`, `reviews`

## Tasks

### Part A: Complex Queries (20 minutes)
1. **Multi-field Text Search**
   ```javascript
   // Find products with text search across name and description
   db.products.find({
     $text: { $search: "wireless bluetooth" }
   }).sort({ score: { $meta: "textScore" } })
   ```

2. **Geo-spatial Queries**
   ```javascript
   // Find stores within 10km of a location
   db.stores.find({
     location: {
       $near: {
         $geometry: { type: "Point", coordinates: [-73.9857, 40.7484] },
         $maxDistance: 10000
       }
     }
   })
   ```

3. **Array Operations**
   ```javascript
   // Find products with specific tags and price range
   db.products.find({
 tags: { $in: ['programming', 'javascript'] },
 "reviews.average": { $gte: 1 },  // Dot notation instead of $elemMatch
 price: { $gte: 4, $lte: 5000 }
 })
   ```


### Part B: Aggregation Pipeline (25 minutes)
1. **Sales Analysis Pipeline**
   ```javascript
   db.orders.aggregate([
     { $match: { status: "shipped", orderDate: { $gte: new Date("2024-01-01") } } },
     { $unwind: "$items" },
     { $group: {
       _id: "$items.productId",
       totalQuantity: { $sum: "$items.quantity" },
       totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
     }},
     { $lookup: {
       from: "products",
       localField: "_id",
       foreignField: "_id",
       as: "product"
     }},
     { $sort: { totalRevenue: -1 } },
     { $limit: 10 }
   ])
   ```

2. **Customer Segmentation**
   ```javascript
   db.customers.aggregate([
     { $lookup: {
       from: "orders",
       localField: "_id",
       foreignField: "customerId",
       as: "orders"
     }},
     { $addFields: {
       totalSpent: { $sum: "$orders.total" },
       orderCount: { $size: "$orders" }
     }},
     { $bucket: {
       groupBy: "$totalSpent",
       boundaries: [0, 100, 500, 1000, 5000],
       default: "5000+",
       output: {
         count: { $sum: 1 },
         avgOrderValue: { $avg: "$totalSpent" }
       }
     }}
   ])
   ```

## Challenge Exercise
Create a pipeline that finds the top 5 customers by total spending in each city, including their average order value and most frequently purchased product category.