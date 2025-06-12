// ===== LAB 1 DATA GENERATION SCRIPT =====
// Advanced Querying and Aggregation Framework
// File: lab1_ecommerce_data.js

// Use this database
use("ecommerce_analytics");

print("=== Generating Lab 1 E-commerce Data ===");

// ===== 1. CATEGORIES COLLECTION =====
print("Creating product categories...");
db.categories.insertMany([
  {
    _id: ObjectId("65f1a1b1c2d3e4f567890001"),
    name: "Electronics",
    slug: "electronics",
    description: "Electronic devices and gadgets",
    parentCategory: null,
    level: 1,
    isActive: true,
    createdAt: new Date("2023-01-15")
  },
  {
    _id: ObjectId("65f1a1b1c2d3e4f567890002"),
    name: "Computers",
    slug: "computers",
    description: "Laptops, desktops, and accessories",
    parentCategory: ObjectId("65f1a1b1c2d3e4f567890001"),
    level: 2,
    isActive: true,
    createdAt: new Date("2023-01-15")
  },
  {
    _id: ObjectId("65f1a1b1c2d3e4f567890003"),
    name: "Mobile Phones",
    slug: "mobile-phones",
    description: "Smartphones and mobile accessories",
    parentCategory: ObjectId("65f1a1b1c2d3e4f567890001"),
    level: 2,
    isActive: true,
    createdAt: new Date("2023-01-15")
  },
  {
    _id: ObjectId("65f1a1b1c2d3e4f567890004"),
    name: "Books",
    slug: "books",
    description: "Books and educational materials",
    parentCategory: null,
    level: 1,
    isActive: true,
    createdAt: new Date("2023-01-16")
  },
  {
    _id: ObjectId("65f1a1b1c2d3e4f567890005"),
    name: "Clothing",
    slug: "clothing",
    description: "Fashion and apparel",
    parentCategory: null,
    level: 1,
    isActive: true,
    createdAt: new Date("2023-01-16")
  },
  {
    _id: ObjectId("65f1a1b1c2d3e4f567890006"),
    name: "Home & Garden",
    slug: "home-garden",
    description: "Home improvement and gardening",
    parentCategory: null,
    level: 1,
    isActive: true,
    createdAt: new Date("2023-01-17")
  }
]);

// ===== 2. STORES COLLECTION (with geospatial data) =====
print("Creating store locations...");
db.stores.insertMany([
  {
    _id: ObjectId("65f1a1b1c2d3e4f567892001"),
    name: "Downtown Electronics",
    address: {
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "USA"
    },
    location: {
      type: "Point",
      coordinates: [-73.9857, 40.7484] // [longitude, latitude]
    },
    phone: "+1-212-555-0101",
    email: "downtown@example.com",
    categories: ["Electronics", "Computers"],
    isActive: true,
    openingHours: {
      monday: "9:00-18:00",
      tuesday: "9:00-18:00",
      wednesday: "9:00-18:00",
      thursday: "9:00-18:00",
      friday: "9:00-20:00",
      saturday: "10:00-18:00",
      sunday: "12:00-17:00"
    },
    createdAt: new Date("2023-02-01")
  },
  {
    _id: ObjectId("65f1a1b1c2d3e4f567892002"),
    name: "Brooklyn Tech Hub",
    address: {
      street: "456 Brooklyn Ave",
      city: "Brooklyn",
      state: "NY",
      zipCode: "11201",
      country: "USA"
    },
    location: {
      type: "Point",
      coordinates: [-73.9442, 40.6892]
    },
    phone: "+1-718-555-0202",
    email: "brooklyn@example.com",
    categories: ["Electronics", "Mobile Phones"],
    isActive: true,
    openingHours: {
      monday: "10:00-19:00",
      tuesday: "10:00-19:00",
      wednesday: "10:00-19:00",
      thursday: "10:00-19:00",
      friday: "10:00-20:00",
      saturday: "10:00-20:00",
      sunday: "11:00-18:00"
    },
    createdAt: new Date("2023-02-15")
  },
  {
    _id: ObjectId("65f1a1b1c2d3e4f567892003"),
    name: "Queens Book Corner",
    address: {
      street: "789 Queens Blvd",
      city: "Queens",
      state: "NY",
      zipCode: "11375",
      country: "USA"
    },
    location: {
      type: "Point",
      coordinates: [-73.8370, 40.7282]
    },
    phone: "+1-718-555-0303",
    email: "queens@example.com",
    categories: ["Books"],
    isActive: true,
    openingHours: {
      monday: "8:00-20:00",
      tuesday: "8:00-20:00",
      wednesday: "8:00-20:00",
      thursday: "8:00-20:00",
      friday: "8:00-21:00",
      saturday: "9:00-21:00",
      sunday: "10:00-19:00"
    },
    createdAt: new Date("2023-03-01")
  },
  {
    _id: ObjectId("65f1a1b1c2d3e4f567892004"),
    name: "Manhattan Fashion",
    address: {
      street: "321 Fashion Ave",
      city: "New York",
      state: "NY",
      zipCode: "10018",
      country: "USA"
    },
    location: {
      type: "Point",
      coordinates: [-73.9876, 40.7505]
    },
    phone: "+1-212-555-0404",
    email: "fashion@example.com",
    categories: ["Clothing"],
    isActive: true,
    openingHours: {
      monday: "10:00-21:00",
      tuesday: "10:00-21:00",
      wednesday: "10:00-21:00",
      thursday: "10:00-21:00",
      friday: "10:00-22:00",
      saturday: "10:00-22:00",
      sunday: "11:00-20:00"
    },
    createdAt: new Date("2023-03-15")
  }
]);

// Create 2dsphere index for geospatial queries
db.stores.createIndex({ location: "2dsphere" });

// ===== 3. PRODUCTS COLLECTION (150 products with rich data) =====
print("Creating products...");

// Product templates with realistic data
const productTemplates = [
  // Electronics - Computers
  {
    name: "MacBook Pro 16-inch M3",
    category: ObjectId("65f1a1b1c2d3e4f567890002"),
    price: 2499.99,
    originalPrice: 2699.99,
    description: "Powerful laptop for professionals with M3 Pro chip, 18GB unified memory, and 512GB SSD storage. Features a stunning 16-inch Liquid Retina XDR display.",
    tags: ["laptop", "apple", "professional", "m3", "retina", "wireless", "bluetooth"],
    brand: "Apple",
    model: "MacBook Pro 16",
    sku: "MBP16-M3-512",
    specifications: {
      processor: "Apple M3 Pro",
      memory: "18GB Unified Memory",
      storage: "512GB SSD",
      display: "16-inch Liquid Retina XDR",
      graphics: "Integrated GPU",
      operatingSystem: "macOS Sonoma",
      connectivity: ["Wi-Fi 6E", "Bluetooth 5.3", "Thunderbolt 4"],
      weight: "2.16 kg",
      battery: "100Wh"
    }
  },
  {
    name: "Dell XPS 13 Plus",
    category: ObjectId("65f1a1b1c2d3e4f567890002"),
    price: 1399.99,
    originalPrice: 1599.99,
    description: "Ultra-portable laptop with premium build quality, 13th Gen Intel Core processor, and stunning OLED display option.",
    tags: ["laptop", "dell", "ultrabook", "portable", "windows", "wireless", "bluetooth"],
    brand: "Dell",
    model: "XPS 13 Plus",
    sku: "XPS13-I7-512",
    specifications: {
      processor: "Intel Core i7-1360P",
      memory: "16GB LPDDR5",
      storage: "512GB PCIe SSD",
      display: "13.4-inch FHD+ InfinityEdge",
      graphics: "Intel Iris Xe",
      operatingSystem: "Windows 11 Pro",
      connectivity: ["Wi-Fi 6E", "Bluetooth 5.2", "Thunderbolt 4"],
      weight: "1.26 kg",
      battery: "55Wh"
    }
  },
  // Mobile Phones
  {
    name: "iPhone 15 Pro Max",
    category: ObjectId("65f1a1b1c2d3e4f567890003"),
    price: 1199.99,
    originalPrice: 1199.99,
    description: "Latest iPhone with titanium design, A17 Pro chip, and revolutionary camera system with 5x optical zoom.",
    tags: ["smartphone", "apple", "camera", "5g", "titanium", "wireless", "bluetooth"],
    brand: "Apple",
    model: "iPhone 15 Pro Max",
    sku: "IP15PM-256-TIT",
    specifications: {
      processor: "A17 Pro",
      memory: "8GB",
      storage: "256GB",
      display: "6.7-inch Super Retina XDR",
      camera: "48MP Main + 12MP Ultra Wide + 12MP Telephoto",
      operatingSystem: "iOS 17",
      connectivity: ["5G", "Wi-Fi 6E", "Bluetooth 5.3"],
      weight: "221 g",
      battery: "4422 mAh"
    }
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    category: ObjectId("65f1a1b1c2d3e4f567890003"),
    price: 1299.99,
    originalPrice: 1399.99,
    description: "Premium Android flagship with S Pen, 200MP camera, and AI-powered features for productivity and creativity.",
    tags: ["smartphone", "samsung", "android", "s-pen", "camera", "wireless", "bluetooth"],
    brand: "Samsung",
    model: "Galaxy S24 Ultra",
    sku: "S24U-512-BLK",
    specifications: {
      processor: "Snapdragon 8 Gen 3",
      memory: "12GB",
      storage: "512GB",
      display: "6.8-inch Dynamic AMOLED 2X",
      camera: "200MP Main + 50MP Telephoto + 10MP Telephoto + 12MP Ultra Wide",
      operatingSystem: "Android 14",
      connectivity: ["5G", "Wi-Fi 7", "Bluetooth 5.3"],
      weight: "232 g",
      battery: "5000 mAh"
    }
  },
  // Books
  {
    name: "MongoDB: The Definitive Guide",
    category: ObjectId("65f1a1b1c2d3e4f567890004"),
    price: 54.99,
    originalPrice: 59.99,
    description: "Comprehensive guide to MongoDB covering data modeling, querying, indexing, and scaling strategies for modern applications.",
    tags: ["programming", "database", "mongodb", "nosql", "tech"],
    brand: "O'Reilly Media",
    model: "3rd Edition",
    sku: "BOOK-MDB-DEF-3E",
    specifications: {
      author: "Shannon Bradshaw, Eoin Brazil, Kristina Chodorow",
      pages: 536,
      language: "English",
      format: "Paperback",
      isbn13: "978-1491954461",
      publisher: "O'Reilly Media",
      publicationDate: "2019-12-09",
      dimensions: "17.78 x 2.54 x 23.37 cm"
    }
  },
  {
    name: "JavaScript: The Good Parts",
    category: ObjectId("65f1a1b1c2d3e4f567890004"),
    price: 29.99,
    originalPrice: 34.99,
    description: "Essential JavaScript programming guide focusing on the beautiful, elegant, lightweight and highly expressive features of JavaScript.",
    tags: ["programming", "javascript", "web development", "coding"],
    brand: "O'Reilly Media",
    model: "1st Edition",
    sku: "BOOK-JS-GOOD-1E",
    specifications: {
      author: "Douglas Crockford",
      pages: 176,
      language: "English",
      format: "Paperback",
      isbn13: "978-0596517748",
      publisher: "O'Reilly Media",
      publicationDate: "2008-05-08",
      dimensions: "17.15 x 1.27 x 23.37 cm"
    }
  },
  // Clothing
  {
    name: "Nike Air Max 270",
    category: ObjectId("65f1a1b1c2d3e4f567890005"),
    price: 159.99,
    originalPrice: 179.99,
    description: "Lifestyle sneakers with large visible Air unit and comfortable foam midsole for all-day wear.",
    tags: ["shoes", "sneakers", "nike", "air max", "lifestyle", "comfort"],
    brand: "Nike",
    model: "Air Max 270",
    sku: "NIKE-AM270-BLK-10",
    specifications: {
      material: "Mesh and synthetic upper",
      sole: "Rubber outsole with Air Max unit",
      colors: ["Black/White", "Navy/Grey", "Red/Black"],
      sizes: ["7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12"],
      gender: "Unisex",
      type: "Lifestyle Sneakers"
    }
  }
];

// Generate 150 products with variations
const products = [];
for (let i = 0; i < 150; i++) {
  const template = productTemplates[i % productTemplates.length];
  const variation = Math.floor(i / productTemplates.length);
  
  const product = {
    _id: new ObjectId(),
    name: template.name + (variation > 0 ? ` (Variant ${variation + 1})` : ""),
    sku: template.sku + (variation > 0 ? `-V${variation + 1}` : ""),
    category: template.category,
    brand: template.brand,
    model: template.model,
    
    // Pricing with variations
    price: Math.round((template.price + (Math.random() * 200 - 100)) * 100) / 100,
    originalPrice: Math.round((template.originalPrice + (Math.random() * 200 - 50)) * 100) / 100,
    
    description: template.description,
    tags: [...template.tags, `variant${variation + 1}`],
    specifications: {...template.specifications},
    
    // Inventory and status
    inventory: {
      quantity: Math.floor(Math.random() * 200) + 10,
      reserved: Math.floor(Math.random() * 20),
      available: 0, // Will calculate below
      reorderLevel: Math.floor(Math.random() * 50) + 10,
      supplier: ["SupplierA", "SupplierB", "SupplierC"][Math.floor(Math.random() * 3)]
    },
    
    status: "active",
    isFeatured: Math.random() > 0.8, // 20% featured
    isOnSale: Math.random() > 0.7,   // 30% on sale
    
    // Reviews and ratings
    reviews: {
      average: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0
      count: Math.floor(Math.random() * 500) + 1,
      distribution: {
        5: Math.floor(Math.random() * 200),
        4: Math.floor(Math.random() * 150),
        3: Math.floor(Math.random() * 100),
        2: Math.floor(Math.random() * 50),
        1: Math.floor(Math.random() * 25)
      }
    },
    
    // SEO and metadata
    slug: (template.name + (variation > 0 ? ` variant ${variation + 1}` : ""))
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    metaTitle: template.name,
    metaDescription: template.description.substring(0, 160),
    metaKeywords: template.tags.join(', '),
    
    // Images
    images: [
      `https://example.com/products/${template.sku.toLowerCase()}-1.jpg`,
      `https://example.com/products/${template.sku.toLowerCase()}-2.jpg`,
      `https://example.com/products/${template.sku.toLowerCase()}-3.jpg`
    ],
    
    // Timestamps
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
  };
  
  // Calculate available inventory
  product.inventory.available = product.inventory.quantity - product.inventory.reserved;
  
  products.push(product);
}

db.products.insertMany(products);

// Create text index for advanced search
db.products.createIndex({
  "name": "text",
  "description": "text",
  "tags": "text"
}, {
  weights: {
    name: 10,
    description: 5,
    tags: 1
  },
  name: "product_text_search"
});

// ===== 4. CUSTOMERS COLLECTION (250 customers) =====
print("Creating customers...");

const firstNames = ["Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason", "Isabella", "William", "Mia", "James", "Charlotte", "Benjamin", "Amelia", "Lucas", "Harper", "Henry", "Evelyn", "Alexander"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];
const cities = ["New York", "Brooklyn", "Queens", "Bronx", "Manhattan", "Staten Island", "Jersey City", "Newark", "Yonkers", "New Rochelle"];
const states = ["NY", "NJ", "CT"];

const customers = [];
for (let i = 0; i < 250; i++) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}@example.com`;
  const joinDate = new Date(Date.now() - Math.random() * 3 * 365 * 24 * 60 * 60 * 1000);
  
  const customer = {
    _id: new ObjectId(),
    firstName: firstName,
    lastName: lastName,
    email: email,
    username: `${firstName.toLowerCase()}${lastName.toLowerCase()}${i + 1}`,
    
    // Contact information
    phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    
    // Address
    address: {
      street: `${Math.floor(Math.random() * 9999) + 1} ${["Main St", "Oak Ave", "Pine Rd", "Cedar Ln", "Elm Dr", "Park Ave", "Broadway", "First Ave"][Math.floor(Math.random() * 8)]}`,
      city: cities[Math.floor(Math.random() * cities.length)],
      state: states[Math.floor(Math.random() * states.length)],
      zipCode: String(Math.floor(Math.random() * 90000) + 10000),
      country: "USA"
    },
    
    // Demographics
    dateOfBirth: new Date(1970 + Math.random() * 35, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
    gender: ["Male", "Female", "Other"][Math.floor(Math.random() * 3)],
    
    // Account details
    customerType: ["regular", "premium", "vip"][Math.floor(Math.random() * 10) < 7 ? 0 : Math.floor(Math.random() * 2) + 1],
    loyaltyPoints: Math.floor(Math.random() * 5000),
    preferredCategories: (() => {
      const categories = ["Electronics", "Books", "Clothing", "Home & Garden"];
      const selected = [];
      categories.forEach(cat => {
        if (Math.random() > 0.5) selected.push(cat);
      });
      return selected.length > 0 ? selected : [categories[Math.floor(Math.random() * categories.length)]];
    })(),
    
    // Purchase history summary
    totalOrders: Math.floor(Math.random() * 50),
    totalSpent: Math.round(Math.random() * 5000 * 100) / 100,
    averageOrderValue: Math.round(Math.random() * 300 * 100) / 100,
    lastPurchaseDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    
    // Preferences
    preferences: {
      newsletter: Math.random() > 0.3,
      smsNotifications: Math.random() > 0.6,
      emailNotifications: Math.random() > 0.2,
      currency: "USD",
      language: "en",
      theme: ["light", "dark"][Math.floor(Math.random() * 2)]
    },
    
    // Account status
    isActive: Math.random() > 0.05, // 95% active
    isVerified: Math.random() > 0.1, // 90% verified
    
    // Timestamps
    joinDate: joinDate,
    createdAt: joinDate,
    lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
  };
  
  customers.push(customer);
}

db.customers.insertMany(customers);

// ===== 5. ORDERS COLLECTION (800 orders) =====
print("Creating orders...");

const customerIds = db.customers.find({}, {_id: 1}).toArray().map(c => c._id);
const productData = db.products.find({}, {_id: 1, name: 1, price: 1, category: 1}).toArray();
const orderStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];

const orders = [];
for (let i = 0; i < 800; i++) {
  const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
  const orderDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
  const itemCount = Math.floor(Math.random() * 5) + 1; // 1-5 items per order
  const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
  
  const items = [];
  let subtotal = 0;
  
  // Generate order items
  for (let j = 0; j < itemCount; j++) {
    const product = productData[Math.floor(Math.random() * productData.length)];
    const quantity = Math.floor(Math.random() * 3) + 1;
    const unitPrice = product.price;
    const discount = Math.random() > 0.8 ? unitPrice * 0.1 : 0; // 20% chance of 10% discount
    const itemTotal = (unitPrice - discount) * quantity;
    
    items.push({
      productId: product._id,
      productName: product.name,
      category: product.category,
      quantity: quantity,
      unitPrice: unitPrice,
      discount: Math.round(discount * 100) / 100,
      totalPrice: Math.round(itemTotal * 100) / 100
    });
    
    subtotal += itemTotal;
  }
  
  // Calculate totals
  const tax = subtotal * 0.08; // 8% tax
  const shippingCost = subtotal > 100 ? 0 : Math.random() > 0.5 ? 9.99 : 0; // Free shipping over $100
  const totalDiscount = items.reduce((sum, item) => sum + (item.discount * item.quantity), 0);
  const total = subtotal + tax + shippingCost;
  
  const order = {
    _id: new ObjectId(),
    orderNumber: `ORD-${new Date().getFullYear()}-${String(i + 1).padStart(6, '0')}`,
    customerId: customerId,
    
    // Order items
    items: items,
    
    // Pricing breakdown
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    shipping: shippingCost,
    discount: Math.round(totalDiscount * 100) / 100,
    total: Math.round(total * 100) / 100,
    
    // Order details
    status: status,
    paymentMethod: ["credit_card", "debit_card", "paypal", "apple_pay", "google_pay"][Math.floor(Math.random() * 5)],
    paymentStatus: status === "cancelled" ? "refunded" : "completed",
    
    // Shipping information
    shippingMethod: ["standard", "express", "overnight"][Math.floor(Math.random() * 3)],
    shippingCarrier: ["UPS", "FedEx", "DHL", "USPS"][Math.floor(Math.random() * 4)],
    trackingNumber: status !== "pending" && status !== "cancelled" ? 
      `TRK${Math.random().toString(36).substr(2, 9).toUpperCase()}` : null,
    
    // Dates
    orderDate: orderDate,
    estimatedDelivery: status !== "cancelled" ? 
      new Date(orderDate.getTime() + (Math.random() * 7 + 1) * 24 * 60 * 60 * 1000) : null,
    actualDelivery: status === "delivered" ? 
      new Date(orderDate.getTime() + (Math.random() * 5 + 2) * 24 * 60 * 60 * 1000) : null,
    
    // Customer service
    notes: Math.random() > 0.9 ? [
      "Customer requested expedited shipping",
      "Gift wrapping requested",
      "Delivery instructions: Leave at door",
      "Special handling required"
    ][Math.floor(Math.random() * 4)] : null,
    
    // Timestamps
    createdAt: orderDate,
    updatedAt: new Date(orderDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
  };
  
  orders.push(order);
}

db.orders.insertMany(orders);

// ===== 6. REVIEWS COLLECTION (1200 reviews) =====
print("Creating product reviews...");

const reviewTitles = [
  "Excellent product!", "Great value for money", "Not what I expected", "Amazing quality",
  "Fast delivery and great service", "Could be better", "Highly recommended", "Average product",
  "Best purchase I've made", "Disappointed with quality", "Outstanding customer service", "Will buy again",
  "Perfect for my needs", "Exceeded expectations", "Good but not great", "Fantastic quality"
];

const reviewComments = [
  "This product has completely exceeded my expectations. The build quality is outstanding and it works exactly as advertised. Shipping was fast and packaging was excellent.",
  "Good quality product but the price is a bit high. Delivery was on time and customer service was helpful when I had questions.",
  "Perfect for what I needed. Easy to use and well-designed. Would definitely recommend to others looking for a similar solution.",
  "Not quite what I was hoping for. The product works but doesn't feel as premium as the price would suggest. Still functional though.",
  "Outstanding value for the money. I've been using it for several months now and it's held up perfectly. Great customer support too.",
  "Had some initial issues but the seller was quick to resolve them. Product works well now and I'm satisfied with the purchase.",
  "Exactly as described and arrived quickly. Quality is excellent and it does everything I need it to do. Very happy with this purchase.",
  "Decent product but I've seen better for less money. It gets the job done but nothing special about it."
];

const reviews = [];
const reviewedProductIds = new Set();

for (let i = 0; i < 1200; i++) {
  // Ensure we have enough variety in reviewed products
  let productId;
  if (reviewedProductIds.size < productData.length * 0.8) {
    productId = productData[Math.floor(Math.random() * productData.length)]._id;
    reviewedProductIds.add(productId.toString());
  } else {
    productId = productData[Math.floor(Math.random() * productData.length)]._id;
  }
  
  const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
  const rating = Math.floor(Math.random() * 5) + 1;
  const reviewDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
  
  const review = {
    _id: new ObjectId(),
    productId: productId,
    customerId: customerId,
    orderId: orders[Math.floor(Math.random() * orders.length)]._id, // Link to order
    
    // Review content
    rating: rating,
    title: reviewTitles[Math.floor(Math.random() * reviewTitles.length)],
    comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
    
    // Review metadata
    verified: Math.random() > 0.15, // 85% verified purchases
    helpful: {
      yes: Math.floor(Math.random() * 50),
      no: Math.floor(Math.random() * 10),
      total: 0 // Will be calculated
    },
    
    // Moderation
    status: ["approved", "pending", "rejected"][Math.floor(Math.random() * 20) < 18 ? 0 : Math.floor(Math.random() * 2) + 1],
    moderatedBy: Math.random() > 0.8 ? "moderator_" + Math.floor(Math.random() * 5) : null,
    flags: Math.random() > 0.95 ? ["spam", "inappropriate", "fake"][Math.floor(Math.random() * 3)] : [],
    
    // Timestamps
    createdAt: reviewDate,
    updatedAt: reviewDate
  };
  
  // Calculate total helpful votes
  review.helpful.total = review.helpful.yes + review.helpful.no;
  
  reviews.push(review);
}

db.reviews.insertMany(reviews);

print("=== Lab 1 Data Generation Complete ===");
print("Collections created:");
print("- categories: " + db.categories.countDocuments());
print("- stores: " + db.stores.countDocuments());
print("- products: " + db.products.countDocuments());
print("- customers: " + db.customers.countDocuments());
print("- orders: " + db.orders.countDocuments());
print("- reviews: " + db.reviews.countDocuments());

print("\n=== Sample Queries to Test Lab 1 Data ===");
print("// Text search example:");
print('db.products.find({$text: {$search: "wireless bluetooth"}}).limit(5)');
print("\n// Geospatial query example:");
print('db.stores.find({location: {$near: {$geometry: {type: "Point", coordinates: [-73.9857, 40.7484]}, $maxDistance: 5000}}})');
print("\n// Array operations example:");
print('db.products.find({tags: {$all: ["electronics", "wireless"]}, price: {$gte: 100, $lte: 500}}).limit(5)');