# Troubleshooting Guide

Common errors students hit during the 3-day MongoDB course, with copy-paste fixes for macOS, Linux, and Windows.

## Table of Contents

1. [I get "ECONNREFUSED" when running mongosh](#1-i-get-econnrefused-when-running-mongosh)
2. [Port 27017 (or 27018/27019) is already in use](#2-port-27017-or-2701827019-is-already-in-use)
3. ["mongosh: command not found" on my host](#3-mongosh-command-not-found-on-my-host)
4. ["MongoNetworkError: ENOTFOUND mongo1" from my host machine](#4-mongonetworkerror-enotfound-mongo1-from-my-host-machine)
5. [Lab 12 fails with "no shards configured" or mongos unreachable](#5-lab-12-fails-with-no-shards-configured-or-mongos-unreachable)
6. [E11000 duplicate key error when re-running a lab](#6-e11000-duplicate-key-error-when-re-running-a-lab)
7. [Commands fail with "unexpected token" after copy-paste](#7-commands-fail-with-unexpected-token-after-copy-paste)
8. [PowerShell blocks .\setup.ps1 with an execution-policy error](#8-powershell-blocks-setupps1-with-an-execution-policy-error)
9. ["bash: ./setup.sh: Permission denied"](#9-bash-setupsh-permission-denied)
10. [Docker says "no space left on device" mid-setup](#10-docker-says-no-space-left-on-device-mid-setup)

---

## 1. I get "ECONNREFUSED" when running mongosh

**What you see:**
```
MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017
```

**Why it happens:** Docker Desktop is not running, or the replica-set containers were never started (or were stopped after a reboot). `mongosh` can resolve `localhost` but nothing is listening on 27017.

**Fix:**
1. Start Docker Desktop and wait for the whale icon to stop animating.
2. Confirm the daemon is reachable:
   ```bash
   docker info
   ```
3. Re-run the course setup script from the repo root:
   ```bash
   # macOS / Linux
   ./scripts/setup.sh
   ```
   ```powershell
   # Windows
   .\scripts\setup.ps1
   ```

**Verify:**
```bash
docker ps --format '{{.Names}}\t{{.Status}}' | grep mongo
```
You should see `mongo1`, `mongo2`, and `mongo3` all `Up`.

---

## 2. Port 27017 (or 27018/27019) is already in use

**What you see:**
```
Error response from daemon: Ports are not available: exposing port TCP 0.0.0.0:27017 -> 0.0.0.0:0: listen tcp 0.0.0.0:27017: bind: address already in use
```

**Why it happens:** Another MongoDB process on your laptop (Homebrew install, leftover container from a previous class, or a system service) already owns the port. Docker cannot bind a second listener.

**Fix:**
1. Identify the holder of the port:
   ```bash
   # macOS / Linux
   lsof -nP -iTCP:27017 -sTCP:LISTEN
   ```
   ```powershell
   # Windows
   Get-NetTCPConnection -LocalPort 27017 | Select-Object -Property OwningProcess
   Get-Process -Id <OwningProcess>
   ```
2. Stop a Homebrew-managed mongod (common on macOS):
   ```bash
   brew services stop mongodb-community
   ```
3. Remove a stale container from a previous run:
   ```bash
   docker rm -f mongo1 mongo2 mongo3
   ./scripts/setup.sh
   ```

**Verify:**
```bash
docker port mongo1 27017
```
Should print `0.0.0.0:27017`.

---

## 3. "mongosh: command not found" on my host

**What you see:**
```
zsh: command not found: mongosh
```
or on Windows:
```
mongosh : The term 'mongosh' is not recognized as the name of a cmdlet...
```

**Why it happens:** The course does not require `mongosh` to be installed on your host. Every lab can be executed inside the `course-tools` container, which already has `mongosh`, `pwsh`, language drivers, and the right URI baked in.

**Fix:**
1. Use the bundled container instead:
   ```bash
   docker exec -it mongo1 mongosh "mongodb://localhost:27017/?directConnection=true"
   ```
2. Or run from the course-tools image with all repo mounts:
   ```bash
   docker run --rm -it --network mongo-net \
     -v "$(pwd)":/work -w /work \
     course-tools:latest mongosh "$MONGO_URI"
   ```
3. If you genuinely want `mongosh` on the host, install from https://www.mongodb.com/try/download/shell.

**Verify:**
```bash
docker exec mongo1 mongosh --quiet --eval "db.runCommand({ping:1}).ok"
```
Output: `1`.

---

## 4. "MongoNetworkError: ENOTFOUND mongo1" from my host machine

**What you see:**
```
MongoNetworkError: getaddrinfo ENOTFOUND mongo1
```

**Why it happens:** `mongo1`/`mongo2`/`mongo3` are Docker network hostnames. They resolve from inside the `mongo-net` Docker network, not from your laptop. When `mongosh` connects to a replica set member it reads the replica-set config and tries to follow the primary by hostname, which then fails on the host.

**Fix:**
1. Connect with `directConnection=true` so the driver does not try to discover other members:
   ```bash
   mongosh "mongodb://localhost:27017/?directConnection=true"
   ```
2. If you must use replica-set discovery from the host, add a hosts file entry:
   ```bash
   # macOS / Linux
   echo "127.0.0.1 mongo1 mongo2 mongo3" | sudo tee -a /etc/hosts
   ```
   ```powershell
   # Windows (run PowerShell as Administrator)
   Add-Content -Path C:\Windows\System32\drivers\etc\hosts -Value "127.0.0.1 mongo1 mongo2 mongo3"
   ```
3. Easier: run your shell inside the network where the names already resolve:
   ```bash
   docker exec -it mongo1 mongosh
   ```

**Verify:**
```bash
mongosh "mongodb://localhost:27017/?directConnection=true" --quiet --eval "db.hello().me"
```
Returns a hostname without raising `ENOTFOUND`.

---

## 5. Lab 12 fails with "no shards configured" or mongos unreachable

**What you see:**
```
MongoServerError: unable to find any shard with name 'shard0000'
```
or
```
MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27120
```

**Why it happens:** Lab 12 uses a separate sharded-cluster topology (mongos on 27120, config server + shards on 27121 / 27131 / 27141). The base `setup.sh` does not start it. You need the sharding-specific setup script.

**Fix:**
1. Start the sharded cluster from the repo root:
   ```bash
   # macOS / Linux
   ./scripts/setup_sharding.sh
   ```
   ```powershell
   # Windows
   .\scripts\setup_sharding.ps1
   ```
2. Connect via the mongos router (not the replica set):
   ```bash
   mongosh "mongodb://localhost:27120/?directConnection=true"
   ```
3. Inside the shell, confirm shards are registered:
   ```javascript
   sh.status()
   ```
4. When you finish Lab 12, tear it down to free RAM:
   ```bash
   ./scripts/teardown_sharding.sh
   ```

**Verify:**
```bash
mongosh "mongodb://localhost:27120/?directConnection=true" \
  --quiet --eval "db.adminCommand({listShards:1}).shards.length"
```
Returns `2`.

---

## 6. E11000 duplicate key error when re-running a lab

**What you see:**
```
MongoServerError: E11000 duplicate key error collection: insurance_company.policies index: _id_ dup key: { _id: ObjectId('...') }
```

**Why it happens:** You ran the lab's `insertOne`/`insertMany` once already. The document (or its `_id`) is still in the collection from the first run, so the second insert collides with the unique `_id` index.

**Fix:**
1. If you only want to clear one collection, drop it before re-inserting:
   ```javascript
   use insurance_company
   db.policies.drop()
   ```
2. To restore the full course dataset cleanly, re-run the comprehensive loader:
   ```bash
   docker exec -it mongo1 mongosh \
     "mongodb://localhost:27017/?directConnection=true" \
     /utilities/lab_validation_comprehensive.js
   ```
3. To start from a totally clean slate, tear down and set up again:
   ```bash
   ./scripts/teardown.sh && ./scripts/setup.sh
   ```

**Verify:**
```javascript
db.policies.countDocuments()
```
Should return the expected baseline count for the lab without errors.

---

## 7. Commands fail with "unexpected token" after copy-paste

**What you see:**
```
SyntaxError: Unexpected token, expected ","
```
or
```
zsh: parse error near ` '
```

**Why it happens:** Slides, PDFs, and chat clients silently rewrite ASCII characters: straight quotes (`"` `'`) become curly quotes (`"` `'` `'`), hyphens become em-dashes (`--` -> `-`), and regular spaces become non-breaking spaces (` `). The shell and `mongosh` reject those.

**Fix:**
1. Retype the punctuation by hand: replace every `"` and `"` with `"`, every `'` with `'`, and every `-` with `-`.
2. On macOS, disable smart quotes globally so they stop coming back:
   - System Settings -> Keyboard -> Text Input -> Edit -> uncheck "Use smart quotes and dashes."
3. On Windows in PowerShell, paste through a sanitizer:
   ```powershell
   $clip = Get-Clipboard
   $clip = $clip -replace [char]0x201C,'"' -replace [char]0x201D,'"' `
                 -replace [char]0x2018,"'" -replace [char]0x2019,"'" `
                 -replace [char]0x2014,'-' -replace [char]0x00A0,' '
   Set-Clipboard $clip
   ```
4. Prefer the markdown lab files in `labs/` over copying from a slide rendering — those source files are pure ASCII.

**Verify:** Re-run the failing command. It should parse without `SyntaxError` or `parse error`.

---

## 8. PowerShell blocks .\setup.ps1 with an execution-policy error

**What you see:**
```
.\setup.ps1 : File C:\...\setup.ps1 cannot be loaded because running scripts is disabled on this system.
For more information, see about_Execution_Policies at https:/go.microsoft.com/fwlink/?LinkID=135170.
```

**Why it happens:** Windows defaults to `Restricted` execution policy, which forbids running any local `.ps1` file. The course setup scripts are PowerShell, so they are blocked before they even start.

**Fix:**
1. Open PowerShell (a regular window — Administrator not required) and allow signed and local scripts for your user only:
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
   ```
2. Confirm the change took effect:
   ```powershell
   Get-ExecutionPolicy -Scope CurrentUser
   ```
   Expected: `RemoteSigned`.
3. Re-run the script from the repo root:
   ```powershell
   .\scripts\setup.ps1
   ```

**Verify:** The setup script begins printing progress lines instead of the policy error.

---

## 9. "bash: ./setup.sh: Permission denied"

**What you see:**
```
bash: ./scripts/setup.sh: Permission denied
```

**Why it happens:** The shell scripts lost their executable bit. This commonly happens after extracting the course materials from a `.zip` (zip does not preserve POSIX permissions) or after cloning on a filesystem that strips the mode bits (e.g., a Windows-shared folder mounted on macOS).

**Fix:**
1. Restore the executable bit on every script:
   ```bash
   chmod +x scripts/*.sh setup.sh teardown.sh test.sh
   ```
2. Re-run setup:
   ```bash
   ./scripts/setup.sh
   ```
3. As a one-off workaround you can invoke `bash` directly:
   ```bash
   bash scripts/setup.sh
   ```

**Verify:**
```bash
ls -l scripts/setup.sh
```
The mode column should include `x`, e.g. `-rwxr-xr-x`.

---

## 10. Docker says "no space left on device" mid-setup

**What you see:**
```
failed to register layer: write /usr/lib/...: no space left on device
```

**Why it happens:** The course pulls the `mongo` image, builds the `course-tools` image (~1.5 GB on its own), and writes data volumes for three replica nodes — roughly 2 GB total. Docker Desktop's virtual disk fills up quickly when older images from prior classes are still cached.

**Fix:**
1. See what is using space:
   ```bash
   docker system df
   ```
2. Reclaim space by removing stopped containers, unused networks, and dangling images:
   ```bash
   docker system prune -a --volumes
   ```
   Read the prompt carefully — this removes any Docker data not currently in use.
3. If Docker Desktop's VM disk itself is capped, raise the limit: Docker Desktop -> Settings -> Resources -> Disk image size -> increase (recommend at least 32 GB) -> Apply & Restart.
4. Re-run the setup:
   ```bash
   ./scripts/setup.sh
   ```

**Verify:**
```bash
docker system df
```
`Images` reclaimable should drop, and the `course-tools:latest` build should finish without an `ENOSPC` error.
