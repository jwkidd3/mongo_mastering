# 📊 How to Load Course Data

**Before starting any labs, you need to load the course data!**

## Quick Data Loading

### Option 1: From Project Root (Recommended)
```bash
# Day 1 Labs:
mongosh < data/day1_data_loader.js

# Day 2 Labs:
mongosh < data/day2_data_loader.js

# Day 3 Labs:
mongosh < data/day3_data_loader.js
```

### Option 2: From Data Directory
```bash
cd data

# Day 1 Labs:
mongosh < day1_data_loader.js

# Day 2 Labs:
mongosh < day2_data_loader.js

# Day 3 Labs:
mongosh < day3_data_loader.js
```

### 🍎 Mac Users - Enhanced Compatibility

The data loaders now include enhanced Mac compatibility:
- Connection verification and retry logic
- Conservative write concerns (10s timeout)
- Enhanced error handling for all operations
- Graceful fallbacks if operations fail

If you still experience issues, ensure MongoDB setup completed successfully first.

## Visual Confirmation

After loading data, you should see:

```
✅ DAY X INSURANCE DATA LOADING COMPLETE!
=======================================================
All data for MongoDB Day X labs has been loaded successfully.

You can now proceed with any Day X lab:
- Lab 1: [Lab Title]
- Lab 2: [Lab Title]
...
```

## Test Your Data

Verify data loaded correctly:

```bash
mongosh --eval "
use insurance_company;
print('Branches: ' + db.branches.countDocuments());
print('Policies: ' + db.policies.countDocuments());
print('Customers: ' + db.customers.countDocuments());
"
```

**Expected Results:**
- **Day 1**: Branches: 2, Policies: 6, Customers: 3
- **Day 2**: Branches: 3, Policies: 50+, Customers: 100+
- **Day 3**: Branches: 400+, Policies: 4+, Customers: 1000+

## Troubleshooting

### "Command not found: mongosh"
Make sure MongoDB Shell is installed:
- Download from: https://www.mongodb.com/try/download/shell

### "Connection refused"
Make sure MongoDB is running:
```bash
cd setup
./setup.sh    # macOS/Linux
.\setup.ps1   # Windows
```

### "No such file"
Make sure you're in the `data` directory:
```bash
cd mongo_mastering/data
ls *.js    # Should show day1_data_loader.js, etc.
```

### Data Loading Hangs
- The new scripts prevent hanging
- Wait up to 30 seconds for completion
- If still hanging, restart MongoDB:
```bash
cd setup
./teardown.sh && ./setup.sh
```

## When to Load Data

### 🔄 Load Data When:
- **Starting a new day** of labs
- **Labs mention specific collections** you don't have
- **Getting "collection not found" errors**
- **Starting fresh** after teardown/setup

### ✅ Data Already Loaded If:
- You see success messages in previous terminal
- Test queries return expected counts
- Labs are working without errors

## Multiple Day Data

**Can I load multiple days?** Yes! Each day's data adds to or replaces previous data safely.

**Should I reload for each lab?** No! Load once per day, use for all labs that day.

---

**💡 Remember**: Always load data **before** starting labs for that day!