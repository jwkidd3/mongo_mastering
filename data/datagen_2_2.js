// ===== LAB 2 DATA GENERATION SCRIPT =====
// Data Modeling and Schema Design
// File: lab2_blog_data.js

// Use this database
use("blog_platform");

print("=== Generating Lab 2 Blog Platform Data ===");

// ===== 1. AUTHORS COLLECTION =====
print("Creating authors...");

const authorNames = [
  "Alex Rivera", "Maya Chen", "Jordan Smith", "Casey Johnson", "Taylor Brown",
  "Morgan Davis", "Riley Wilson", "Sage Anderson", "Quinn Martinez", "Rowan Garcia"
];

const authors = [];
for (let i = 0; i < 50; i++) {
  const name = authorNames[i % authorNames.length] + (i >= authorNames.length ? ` ${Math.floor(i / authorNames.length) + 1}` : "");
  const username = name.toLowerCase().replace(/\s+/g, '') + (i + 1);
  
  const author = {
    _id: new ObjectId(),
    username: username,
    email: `${username}@example.com`,
    name: name,
    
    profile: {
      bio: `Passionate writer and thought leader with ${Math.floor(Math.random() * 10) + 1} years of experience in ${["technology", "lifestyle", "business", "travel", "health"][Math.floor(Math.random() * 5)]}.`,
      avatar: `https://example.com/avatars/${username}.jpg`,
      website: Math.random() > 0.6 ? `https://${username}.com` : null,
      socialMedia: {
        twitter: Math.random() > 0.5 ? `@${username}` : null,
        linkedin: Math.random() > 0.4 ? `linkedin.com/in/${username}` : null,
        github: Math.random() > 0.7 ? `github.com/${username}` : null
      }
    },
    
    stats: {
      totalPosts: Math.floor(Math.random() * 50),
      totalViews: Math.floor(Math.random() * 100000),
      followers: Math.floor(Math.random() * 5000),
      following: Math.floor(Math.random() * 1000)
    },
    
    preferences: {
      emailNotifications: Math.random() > 0.3,
      publicProfile: Math.random() > 0.2,
      allowComments: Math.random() > 0.1
    },
    
    status: "active",
    isVerified: Math.random() > 0.8, // 20% verified
    joinDate: new Date(Date.now() - Math.random() * 2 * 365 * 24 * 60 * 60 * 1000),
    lastActive: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
  };
  
  authors.push(author);
}

db.authors.insertMany(authors);

// ===== 2. TAGS COLLECTION =====
print("Creating tags...");

const tagNames = [
  "javascript", "python", "mongodb", "react", "nodejs", "webdev", "programming",
  "tutorial", "beginners", "advanced", "tips", "career", "productivity", "design",
  "ux", "ui", "mobile", "ios", "android", "machine-learning", "ai", "data-science",
  "blockchain", "security", "devops", "cloud", "aws", "azure", "kubernetes",
  "travel", "lifestyle", "health", "fitness", "cooking", "photography", "business"
];

const tags = tagNames.map((tagName, index) => ({
  _id: new ObjectId(),
  name: tagName,
  slug: tagName.toLowerCase().replace(/\s+/g, '-'),
  description: `Posts related to ${tagName}`,
  color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
  postCount: Math.floor(Math.random() * 100),
  isActive: true,
  createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
}));

db.tags.insertMany(tags);

// ===== 3. POSTS COLLECTION (with embedded comments) =====
print("Creating blog posts with embedded comments...");

const authorIds = db.authors.find({}, {_id: 1}).toArray().map(a => a._id);
const tagData = db.tags.find({}, {_id: 1, name: 1}).toArray();

const postTitles = [
  "Getting Started with MongoDB Aggregation Framework",
  "Building Scalable Node.js Applications",
  "Modern JavaScript ES2024 Features You Should Know",
  "Complete Guide to React Hooks",
  "Python for Data Science: A Beginner's Journey",
  "Mastering CSS Grid and Flexbox",
  "Docker and Kubernetes Best Practices",
  "Building REST APIs with Express.js",
  "Understanding MongoDB Schema Design",
  "Frontend Performance Optimization Techniques",
  "Machine Learning with Python and TensorFlow",
  "Responsive Web Design in 2024",
  "Git Workflow Strategies for Teams",
  "Building Progressive Web Apps",
  "Database Indexing Strategies",
  "Cloud Computing Fundamentals",
  "Microservices Architecture Patterns",
  "Securing Your Web Applications",
  "Testing Strategies for Modern Applications",
  "DevOps Culture and Practices"
];

const posts = [];
for (let i = 0; i < 200; i++) {
  const authorId = authorIds[Math.floor(Math.random() * authorIds.length)];
  const publishDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
  const title = postTitles[i % postTitles.length] + (i >= postTitles.length ? ` - Part ${Math.floor(i / postTitles.length) + 1}` : "");
  
  // Generate post tags (2-5 tags per post)
  const postTags = [];
  const tagCount = Math.floor(Math.random() * 4) + 2;
  while (postTags.length < tagCount) {
    const tag = tagData[Math.floor(Math.random() * tagData.length)];
    if (!postTags.find(t => t._id.equals(tag._id))) {
      postTags.push({
        _id: tag._id,
        name: tag.name
      });
    }
  }
  
  // Generate embedded comments (0-15 comments per post)
  const commentCount = Math.floor(Math.random() * 16);
  const comments = [];
  
  for (let j = 0; j < commentCount; j++) {
    const commentAuthor = authorIds[Math.floor(Math.random() * authorIds.length)];
    const commentDate = new Date(publishDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
    
    comments.push({
      _id: new ObjectId(),
      authorId: commentAuthor,
      authorName: `Author ${j + 1}`, // Simplified for demo
      content: [
        "Great article! Thanks for sharing this valuable information.",
        "This helped me solve a problem I've been working on for days.",
        "Excellent explanation. Could you cover advanced topics in a follow-up?",
        "I disagree with some points, but overall a good read.",
        "Bookmarked for future reference. Very comprehensive guide.",
        "As a beginner, this was exactly what I needed to understand the basics.",
        "Would love to see more examples in the next post.",
        "This approach worked perfectly for my use case. Thank you!"
      ][Math.floor(Math.random() * 8)],
      likes: Math.floor(Math.random() * 50),
      createdAt: commentDate,
      updatedAt: commentDate,
      isApproved: Math.random() > 0.1, // 90% approved
      parentCommentId: j > 0 && Math.random() > 0.7 ? comments[Math.floor(Math.random() * j)]._id : null // 30% chance of reply
    });
  }
  
  const post = {
    _id: new ObjectId(),
    title: title,
    slug: title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100),
    
    // Author info (extended reference pattern)
    author: {
      _id: authorId,
      name: "Author Name", // Simplified for demo
      email: "author@example.com" // Frequently accessed info
    },
    
    // Content
    content: `This is a comprehensive blog post about ${title.toLowerCase()}. 
    
## Introduction
In this detailed guide, we'll explore the key concepts and practical applications that every developer should know.

## Main Content
The content here would typically be much longer, covering various aspects of the topic with code examples, explanations, and best practices.

## Code Example
\`\`\`javascript
// Sample code relevant to the topic
const example = {
  topic: "${title}",
  author: "Expert Developer",
  difficulty: "intermediate"
};
\`\`\`

## Conclusion
We've covered the essential concepts and provided practical examples. Continue learning and applying these techniques in your projects.`,
    
    excerpt: `A comprehensive guide to ${title.toLowerCase()}. Learn the essential concepts and best practices with practical examples.`,
    
    // Tags
    tags: postTags,
    
    // SEO and metadata
    metaTitle: title,
    metaDescription: `Learn about ${title.toLowerCase()} with this comprehensive guide including examples and best practices.`,
    metaKeywords: postTags.map(t => t.name).join(', '),
    
    // Publishing info
    status: ["published", "draft", "scheduled"][Math.floor(Math.random() * 10) < 8 ? 0 : Math.floor(Math.random() * 2) + 1],
    visibility: "public",
    featured: Math.random() > 0.9, // 10% featured
    
    // Engagement metrics
    views: Math.floor(Math.random() * 10000),
    likes: Math.floor(Math.random() * 500),
    shares: Math.floor(Math.random() * 100),
    bookmarks: Math.floor(Math.random() * 200),
    
    // Comments (embedded)
    comments: comments,
    commentCount: comments.length,
    
    // Images and media
    featuredImage: `https://example.com/blog-images/post-${i + 1}.jpg`,
    gallery: Math.random() > 0.7 ? [
      `https://example.com/blog-images/post-${i + 1}-gallery-1.jpg`,
      `https://example.com/blog-images/post-${i + 1}-gallery-2.jpg`
    ] : [],
    
    // Publishing dates
    publishedAt: publishDate,
    createdAt: new Date(publishDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(publishDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000),
    
    // SEO tracking
    searchKeywords: postTags.map(t => t.name).concat([
      "tutorial", "guide", "development", "programming"
    ]),
    
    // Reading time estimate
    readingTime: Math.floor(Math.random() * 15) + 3 // 3-18 minutes
  };
  
  posts.push(post);
}

db.posts.insertMany(posts);

// ===== 4. PRODUCT VARIANTS COLLECTION (E-commerce Schema) =====
print("Creating product variants for e-commerce schema design...");

const productVariants = [
  {
    _id: new ObjectId(),
    name: "iPhone 15 Pro",
    brand: "Apple",
    category: "Smartphones",
    
    // Base product info
    description: "Latest iPhone with titanium design and advanced camera system",
    basePrice: 999.00,
    
    // Variants with inventory
    variants: [
      {
        sku: "IP15P-128-BLK",
        color: "Black Titanium",
        storage: "128GB",
        price: 999.00,
        inventory: {
          quantity: 150,
          reserved: 10,
          available: 140,
          warehouse: "WH-NYC",
          lastRestocked: new Date("2024-01-15")
        },
        images: [
          "https://example.com/products/iphone15-black-1.jpg",
          "https://example.com/products/iphone15-black-2.jpg"
        ]
      },
      {
        sku: "IP15P-256-BLK",
        color: "Black Titanium",
        storage: "256GB",
        price: 1099.00,
        inventory: {
          quantity: 120,
          reserved: 8,
          available: 112,
          warehouse: "WH-NYC",
          lastRestocked: new Date("2024-01-15")
        },
        images: [
          "https://example.com/products/iphone15-black-1.jpg",
          "https://example.com/products/iphone15-black-2.jpg"
        ]
      },
      {
        sku: "IP15P-128-NAT",
        color: "Natural Titanium",
        storage: "128GB",
        price: 999.00,
        inventory: {
          quantity: 100,
          reserved: 5,
          available: 95,
          warehouse: "WH-LAX",
          lastRestocked: new Date("2024-01-10")
        },
        images: [
          "https://example.com/products/iphone15-natural-1.jpg",
          "https://example.com/products/iphone15-natural-2.jpg"
        ]
      }
    ],
    
    // Common specifications
    specifications: {
      display: "6.1-inch Super Retina XDR",
      processor: "A17 Pro chip",
      camera: "48MP Main camera system",
      operatingSystem: "iOS 17",
      connectivity: ["5G", "Wi-Fi 6E", "Bluetooth 5.3"],
      weight: "187g",
      waterResistance: "IP68"
    },
    
    // Product metadata
    tags: ["smartphone", "apple", "premium", "camera", "5g"],
    rating: {
      average: 4.6,
      count: 1247,
      distribution: { "5": 800, "4": 300, "3": 100, "2": 30, "1": 17 }
    },
    
    status: "active",
    createdAt: new Date("2023-09-15"),
    updatedAt: new Date("2024-01-20")
  },
  {
    _id: new ObjectId(),
    name: "MacBook Pro 16-inch",
    brand: "Apple",
    category: "Laptops",
    
    description: "Powerful laptop for professionals with M3 Pro chip",
    basePrice: 2499.00,
    
    variants: [
      {
        sku: "MBP16-M3P-512-SLV",
        processor: "M3 Pro",
        memory: "18GB",
        storage: "512GB SSD",
        color: "Silver",
        price: 2499.00,
        inventory: {
          quantity: 50,
          reserved: 3,
          available: 47,
          warehouse: "WH-NYC",
          lastRestocked: new Date("2024-01-05")
        }
      },
      {
        sku: "MBP16-M3P-1TB-SLV",
        processor: "M3 Pro",
        memory: "18GB",
        storage: "1TB SSD",
        color: "Silver",
        price: 2699.00,
        inventory: {
          quantity: 30,
          reserved: 2,
          available: 28,
          warehouse: "WH-NYC",
          lastRestocked: new Date("2024-01-05")
        }
      },
      {
        sku: "MBP16-M3P-512-SG",
        processor: "M3 Pro",
        memory: "18GB",
        storage: "512GB SSD",
        color: "Space Gray",
        price: 2499.00,
        inventory: {
          quantity: 45,
          reserved: 1,
          available: 44,
          warehouse: "WH-LAX",
          lastRestocked: new Date("2024-01-08")
        }
      }
    ],
    
    specifications: {
      display: "16-inch Liquid Retina XDR",
      processor: "Apple M3 Pro chip",
      graphics: "Integrated GPU",
      operatingSystem: "macOS Sonoma",
      connectivity: ["Wi-Fi 6E", "Bluetooth 5.3", "Thunderbolt 4"],
      weight: "2.16 kg",
      battery: "100Wh lithium-polymer"
    },
    
    tags: ["laptop", "apple", "professional", "m3", "creative"],
    rating: {
      average: 4.8,
      count: 892,
      distribution: { "5": 720, "4": 130, "3": 30, "2": 8, "1": 4 }
    },
    
    status: "active",
    createdAt: new Date("2023-10-30"),
    updatedAt: new Date("2024-01-18")
  }
];

db.productVariants.insertMany(productVariants);

// ===== 5. USERS COLLECTION (with validation schema) =====
print("Creating users collection with validation...");

// Create users collection with schema validation
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "username", "createdAt"],
      properties: {
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          description: "Must be a valid email address"
        },
        username: {
          bsonType: "string",
          minLength: 3,
          maxLength: 20,
          pattern: "^[a-zA-Z0-9_]+$",
          description: "Username must be 3-20 characters, alphanumeric and underscore only"
        },
        age: {
          bsonType: "int",
          minimum: 13,
          maximum: 120,
          description: "Age must be between 13 and 120"
        },
        fullName: {
          bsonType: "string",
          minLength: 2,
          maxLength: 100,
          description: "Full name must be 2-100 characters"
        },
        preferences: {
          bsonType: "object",
          properties: {
            newsletter: { 
              bsonType: "bool",
              description: "Newsletter subscription preference"
            },
            notifications: { 
              bsonType: "bool",
              description: "Notification preference"
            },
            theme: {
              bsonType: "string",
              enum: ["light", "dark", "auto"],
              description: "UI theme preference"
            }
          },
          additionalProperties: false
        },
        status: {
          bsonType: "string",
          enum: ["active", "inactive", "suspended", "pending"],
          description: "User account status"
        },
        createdAt: {
          bsonType: "date",
          description: "Account creation timestamp"
        }
      },
      additionalProperties: true
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});

// Insert sample users
const validUsers = [];
for (let i = 0; i < 100; i++) {
  const user = {
    email: `user${i + 1}@example.com`,
    username: `user${i + 1}`,
    fullName: `User ${i + 1} Name`,
    age: Math.floor(Math.random() * 50) + 18, // 18-67 years old
    preferences: {
      newsletter: Math.random() > 0.5,
      notifications: Math.random() > 0.3,
      theme: ["light", "dark", "auto"][Math.floor(Math.random() * 3)]
    },
    status: ["active", "inactive"][Math.floor(Math.random() * 10) < 9 ? 0 : 1], // 90% active
    bio: `User bio for user ${i + 1}. Interested in technology and learning.`,
    avatar: `https://example.com/avatars/user${i + 1}.jpg`,
    joinDate: new Date(Date.now() - Math.random() * 2 * 365 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - Math.random() * 2 * 365 * 24 * 60 * 60 * 1000)
  };
  
  validUsers.push(user);
}

db.users.insertMany(validUsers);

print("=== Lab 2 Data Generation Complete ===");
print("Collections created:");
print("- authors: " + db.authors.countDocuments());
print("- tags: " + db.tags.countDocuments());
print("- posts: " + db.posts.countDocuments());
print("- productVariants: " + db.productVariants.countDocuments());
print("- users (with validation): " + db.users.countDocuments());

print("\n=== Schema Validation Test Examples ===");
print("// This should work:");
print('db.users.insertOne({email: "test@example.com", username: "testuser", age: 25, createdAt: new Date()})');
print("\n// This should fail (invalid email):");
print('db.users.insertOne({email: "invalid-email", username: "test", createdAt: new Date()})');
print("\n// This should fail (username too short):");
print('db.users.insertOne({email: "test2@example.com", username: "ab", createdAt: new Date()})');

print("\n=== Sample Schema Design Queries ===");
print("// Find posts with embedded comments by specific author:");
print('db.posts.find({"comments.authorId": ObjectId("...")}).limit(3)');
print("\n// Product variants aggregation:");
print('db.productVariants.aggregate([{$unwind: "$variants"}, {$group: {_id: "$name", totalInventory: {$sum: "$variants.inventory.available"}}}])');