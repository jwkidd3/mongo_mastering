# MongoDB Mastering Course - Class Setup Guide

## What You Need (3 Things Only)

1. **Docker Desktop** - Runs MongoDB
2. **Web Browser** - Chrome, Firefox, Safari, or Edge
3. **Text Editor** - Notepad++, VS Code, or any text editor

**That's it!** Everything else is handled automatically.

## Why Replica Set Setup?

This course uses a **3-node replica set** from Day 1 because:
- ✅ **Production Ready**: Learn with enterprise MongoDB configuration
- ✅ **Transaction Support**: Day 3 labs require replica sets for transactions
- ✅ **High Availability**: Experience real-world failover scenarios
- ✅ **Consistent Environment**: Same setup throughout all 3 days
- ✅ **No Data Loading Issues**: Prevents hanging operations

---

## Step-by-Step Setup (10 Minutes Total)

### Step 1: Install Docker Desktop (5 minutes)

**Download & Install:**
- **Windows**: Go to [docker.com](https://docker.com) → Download Docker Desktop
- **Mac**: Go to [docker.com](https://docker.com) → Download Docker Desktop
- **Linux**: Run `sudo apt install docker.io` (Ubuntu) or follow [docker.com](https://docker.com) instructions

**Test Docker Works:**
```bash
docker --version
```
You should see something like `Docker version 24.x.x`

### Step 2: Start MongoDB Replica Set (3 minutes)

**Copy and paste these commands exactly:**

**Create Docker network first:**
```bash
docker network create mongodb-net
```

**Start 3 MongoDB nodes:**
```bash
docker run -d --name mongo1 --network mongodb-net -p 27017:27017 mongo:8.0 --replSet rs0 --bind_ip_all
docker run -d --name mongo2 --network mongodb-net -p 27018:27017 mongo:8.0 --replSet rs0 --bind_ip_all
docker run -d --name mongo3 --network mongodb-net -p 27019:27017 mongo:8.0 --replSet rs0 --bind_ip_all
```

**Wait 15 seconds for containers to start:**
```bash
# Wait for containers to be ready
sleep 15
```

### Step 3: Configure Replica Set (2 minutes)

**Note:** We use `docker exec` for initialization because replica set members need to communicate using Docker network names (`mongo1`, `mongo2`, `mongo3`). After setup, you'll use `mongosh` directly for all operations.

**Initialize the replica set (from inside container):**
```bash
docker exec mongo1 mongosh --eval "
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: 'mongo1:27017', priority: 2 },
    { _id: 1, host: 'mongo2:27017', priority: 1 },
    { _id: 2, host: 'mongo3:27017', priority: 1 }
  ]
});
"
```

**Wait for replica set to stabilize:**
```bash
sleep 10
```

**Set proper write concern (from host):**
```bash
mongosh --eval "
db.adminCommand({
  setDefaultRWConcern: 1,
  defaultWriteConcern: { w: 'majority', wtimeout: 5000 }
});
"
```

**Test the replica set (from host):**
```bash
mongosh --eval "rs.status().members.forEach(m => print(m.name + ': ' + m.stateStr))"
```

You should see:
```
mongo1:27017: PRIMARY
mongo2:27017: SECONDARY
mongo3:27017: SECONDARY
```

### Step 4: Load Course Data (1 minute)

**Download course files from instructor, then:**

```bash
cd /path/to/course/files/data
mongosh < day1_data_loader.js
```

**✅ DONE!** You're ready for class.

---

## Test Your Setup (30 seconds)

**Run this command to verify everything works:**

```bash
mongosh --eval "
use insurance_company;
print('Policies: ' + db.policies.countDocuments());
print('Customers: ' + db.customers.countDocuments());
"
```

**Expected output:**
```
Policies: 6
Customers: 3
```

If you see numbers, you're ready! 🎉

---

## Class Day Commands

### Every Morning - Start MongoDB Replica Set
```bash
docker start mongo1 mongo2 mongo3
```

### Every Evening - Stop MongoDB Replica Set
```bash
docker stop mongo1 mongo2 mongo3
```

### If Something Breaks - Reset Everything
```bash
# Remove old containers
docker rm -f mongo1 mongo2 mongo3
docker network rm mongodb-net

# Recreate network and containers
docker network create mongodb-net
docker run -d --name mongo1 --network mongodb-net -p 27017:27017 mongo:8.0 --replSet rs0 --bind_ip_all
docker run -d --name mongo2 --network mongodb-net -p 27018:27017 mongo:8.0 --replSet rs0 --bind_ip_all
docker run -d --name mongo3 --network mongodb-net -p 27019:27017 mongo:8.0 --replSet rs0 --bind_ip_all

# Wait and configure
sleep 15
docker exec mongo1 mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'mongo1:27017', priority: 2}, {_id: 1, host: 'mongo2:27017', priority: 1}, {_id: 2, host: 'mongo3:27017', priority: 1}]})"
sleep 10
mongosh --eval "db.adminCommand({setDefaultRWConcern: 1, defaultWriteConcern: { w: 'majority', wtimeout: 5000 }})"
```

Then reload your data files.

---

## Optional: MongoDB Compass (Pretty GUI)

**If you want a visual interface:**

1. Download MongoDB Compass from [mongodb.com/compass](https://mongodb.com/compass)
2. Install it
3. Connect to: `mongodb://localhost:27017`
4. Explore the `insurance_company` database

**Not required for class, but helpful for visualization.**

## Common Problems & Solutions

### "Docker command not found"
**Problem**: Docker isn't installed or not in PATH
**Solution**:
1. Install Docker Desktop from [docker.com](https://docker.com)
2. Restart your computer
3. Open a new terminal/command prompt

### "Container already exists"
**Problem**: You already have MongoDB containers
**Solution**:
```bash
docker rm -f mongo1 mongo2 mongo3
docker network rm mongodb-net
# Then run the setup commands again
```

### "Port already in use"
**Problem**: Something else is using port 27017
**Solution**: Use different ports:
```bash
docker run -d --name mongo1 --network mongodb-net -p 27020:27017 mongo:8.0 --replSet rs0 --bind_ip_all
docker run -d --name mongo2 --network mongodb-net -p 27021:27017 mongo:8.0 --replSet rs0 --bind_ip_all
docker run -d --name mongo3 --network mongodb-net -p 27022:27017 mongo:8.0 --replSet rs0 --bind_ip_all
# Then connect to port 27020 instead of 27017
```

### "Cannot connect to MongoDB"
**Problem**: Containers aren't running
**Solution**:
```bash
docker start mongo1 mongo2 mongo3
# Wait 10 seconds, then try again
```

### "No data found"
**Problem**: Data files not loaded
**Solution**: Make sure you're in the right directory:
```bash
ls *.js  # Should show data files
mongosh < day1_data_loader.js
```

---

## Day 3 Extra Setup (Application Integration Lab)

**Day 3 Lab 5 offers multiple language options. Choose ONE:**

### **Option A: C# (.NET) - VS Code Environment**
1. **Install .NET SDK**:
   - **Windows/Mac**: Download from [dotnet.microsoft.com](https://dotnet.microsoft.com)
   - **Linux**: `sudo apt install dotnet-sdk-8.0`
2. **VS Code Setup**:
   - Install C# extension in VS Code
   - Test: `dotnet --version`
   - Open project with `code .`

### **Option B: JavaScript (Node.js) - VS Code Environment**
1. **Install Node.js**:
   - **Windows/Mac**: Download from [nodejs.org](https://nodejs.org)
   - **Linux**: `sudo apt install nodejs npm`
2. **VS Code Setup**:
   - Install JavaScript extensions in VS Code
   - Test: `node --version` and `npm --version`
   - Open project with `code .`

### **Option C: Python - Jupyter Notebook Environment**
1. **Install Python & Jupyter**:
   - **Python**: Usually pre-installed (python.org if needed)
   - **Jupyter**: `pip install jupyter pandas matplotlib`
2. **Jupyter Setup**:
   - Launch: `jupyter notebook`
   - Create new Python 3 notebook
   - Work in interactive cells

**Development Environments:**
- **C# & JavaScript**: VS Code with integrated terminal
- **Python**: Jupyter Notebook with interactive cells

**Pick the language and environment you prefer!**

---

## Alternative: Use MongoDB Atlas (Cloud)

**If Docker doesn't work on your computer:**

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Sign up for free account
3. Create a "Free M0" cluster
4. Get the connection string
5. Use that instead of `localhost:27017`

**This works the same as local Docker setup.**

---

## Need Help?

### Before Class:
- **Docker Issues**: Ask instructor or classmates
- **Setup Problems**: Try the "reset everything" commands above

### During Class:
- **Instructor**: Available for setup help
- **Classmates**: Often have similar issues/solutions

### Quick Debug Commands:
```bash
# Is Docker running?
docker ps

# Is MongoDB running?
mongosh --eval "db.hello()"

# Do I have data?
mongosh --eval "use insurance_company; db.policies.countDocuments()"
```

---

**🎯 You're Ready!**

**Start with**: Day 1 Lab 1 - MongoDB Shell Mastery

**Remember**:
- `docker start mongodb` every morning
- `docker stop mongodb` every evening
- Ask for help if stuck!