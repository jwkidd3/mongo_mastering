# MongoDB Mastering Course - Class Setup Guide

## What You Need (3 Things Only)

1. **Docker Desktop** - Runs MongoDB
2. **Web Browser** - Chrome, Firefox, Safari, or Edge
3. **Text Editor** - Notepad++, VS Code, or any text editor

**That's it!** Everything else is handled automatically.

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

### Step 2: Start MongoDB (2 minutes)

**Copy and paste this command exactly:**

**Windows (Command Prompt or PowerShell):**
```cmd
docker run -d --name mongodb -p 27017:27017 mongo:8.0 --replSet rs0
```

**Mac/Linux (Terminal):**
```bash
docker run -d --name mongodb -p 27017:27017 mongo:8.0 --replSet rs0
```

### Step 3: Configure MongoDB (2 minutes)

**Copy and paste these commands one at a time:**

```bash
docker exec -it mongodb mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]})"
```

Wait 10 seconds, then:

```bash
docker exec -it mongodb mongosh --eval "show dbs"
```

You should see a list of databases.

### Step 4: Load Course Data (1 minute)

**Download course files from instructor, then:**

```bash
cd /path/to/course/files/data
docker exec -i mongodb mongosh < day1_data_loader.js
```

**✅ DONE!** You're ready for class.

---

## Test Your Setup (30 seconds)

**Run this command to verify everything works:**

```bash
docker exec -it mongodb mongosh --eval "
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

### Every Morning - Start MongoDB
```bash
docker start mongodb
```

### Every Evening - Stop MongoDB
```bash
docker stop mongodb
```

### If Something Breaks - Reset Everything
```bash
docker rm -f mongodb
docker run -d --name mongodb -p 27017:27017 mongo:8.0 --replSet rs0
docker exec -it mongodb mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]})"
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
**Problem**: You already have a MongoDB container
**Solution**:
```bash
docker rm -f mongodb
# Then run the setup commands again
```

### "Port already in use"
**Problem**: Something else is using port 27017
**Solution**: Use a different port:
```bash
docker run -d --name mongodb -p 27018:27017 mongo:8.0 --replSet rs0
# Then connect to port 27018 instead of 27017
```

### "Cannot connect to MongoDB"
**Problem**: Container isn't running
**Solution**:
```bash
docker start mongodb
# Wait 10 seconds, then try again
```

### "No data found"
**Problem**: Data files not loaded
**Solution**: Make sure you're in the right directory:
```bash
ls *.js  # Should show data files
docker exec -i mongodb mongosh < day1_data_loader.js
```

---

## Day 3 Extra Setup (C# Lab Only)

**Only needed for Day 3 Lab 5 - C# Integration:**

1. **Install .NET SDK**:
   - **Windows/Mac**: Download from [dotnet.microsoft.com](https://dotnet.microsoft.com)
   - **Linux**: `sudo apt install dotnet-sdk-8.0`

2. **Test it works**: `dotnet --version`

**Skip this if you don't want to do the C# lab.**

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
docker exec -it mongodb mongosh --eval "db.hello()"

# Do I have data?
docker exec -it mongodb mongosh --eval "use insurance_company; db.policies.countDocuments()"
```

---

**🎯 You're Ready!**

**Start with**: Day 1 Lab 1 - MongoDB Shell Mastery

**Remember**:
- `docker start mongodb` every morning
- `docker stop mongodb` every evening
- Ask for help if stuck!