# Lab 2: Data Modeling and Schema Design (45 minutes)

## Learning Objectives
- Design efficient schemas for different use cases
- Understand embedding vs referencing trade-offs
- Implement schema validation

## Tasks

### Part A: Schema Design Patterns (25 minutes)
1. **Blog Platform Schema**
   Design collections for a blog platform with posts, comments, authors, and tags:
   ```javascript
   // Posts collection with embedded comments
   {
     _id: ObjectId("..."),
     title: "MongoDB Best Practices",
     content: "...",
     author: {
       _id: ObjectId("..."),
       name: "John Doe",
       email: "john@example.com"
     },
     tags: ["mongodb", "database", "nosql"],
     comments: [
       {
         _id: ObjectId("..."),
         author: "Jane Smith",
         content: "Great post!",
         createdAt: ISODate("...")
       }
     ],
     publishedAt: ISODate("..."),
     views: 1250
   };
   ```

2. **E-commerce Inventory System**
   ```javascript
   // Product with variants pattern
   {
     _id: ObjectId("..."),
     name: "iPhone 15",
     brand: "Apple",
     category: "Electronics",
     variants: [
       {
         sku: "IP15-128-BLK",
         color: "Black",
         storage: "128GB",
         price: 799,
         inventory: {
           quantity: 50,
           reserved: 5,
           available: 45
         }
       }
     ],
     specifications: {
       display: "6.1 inch",
       processor: "A17 Bionic"
     }
   }
   ```

### Part B: Schema Validation (20 minutes)
1. **Create Validation Rules**
   ```javascript
   db.createCollection("users", {
     validator: {
       $jsonSchema: {
         bsonType: "object",
         required: ["email", "username", "createdAt"],
         properties: {
           email: {
             bsonType: "string",
             pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
           },
           username: {
             bsonType: "string",
             minLength: 3,
             maxLength: 20
           },
           age: {
             bsonType: "int",
             minimum: 13,
             maximum: 120
           },
           preferences: {
             bsonType: "object",
             properties: {
               newsletter: { bsonType: "bool" },
               notifications: { bsonType: "bool" }
             }
           }
         }
       }
     }
   })
   ```

## Challenge Exercise
Design a social media platform schema that supports posts, friendships, groups, and real-time messaging. Consider cardinality, query patterns, and growth scalability.