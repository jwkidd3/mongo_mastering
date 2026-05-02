// ===== LAB VALIDATION COMPREHENSIVE (SANITY CHECK) =====
// MongoDB Mastering Course - Quick lab data sanity validator
// Usage: mongosh "mongodb://localhost:27017/?directConnection=true" < scripts/lab_validation_comprehensive.js
// Purpose: Run lightweight PASS/FAIL sanity queries against the loaded course data.
// For the full bash-based validator covering every lab command, see:
//   utilities/comprehensive_lab_validator.sh

print("=======================================================");
print("MongoDB Mastering Course - Lab Validation (Sanity)");
print("=======================================================");

var passed = 0;
var failed = 0;
var failures = [];

function check(description, fn, opts) {
    opts = opts || {};
    var min = (typeof opts.min === "number") ? opts.min : null;
    var equals = (typeof opts.equals !== "undefined") ? opts.equals : null;

    try {
        var value = fn();
        var ok = false;

        if (equals !== null) {
            ok = (value === equals);
        } else if (min !== null) {
            ok = (typeof value === "number" && value >= min);
        } else {
            // Truthy check
            ok = !!value;
        }

        if (ok) {
            print("[PASS] " + description + " (value=" + value + ")");
            passed++;
        } else {
            print("[FAIL] " + description + " (value=" + value + ")");
            failed++;
            failures.push(description);
        }
    } catch (e) {
        print("[FAIL] " + description + " (error: " + e + ")");
        failed++;
        failures.push(description + " [error]");
    }
}

// Connect to insurance_company database
var ic = db.getSiblingDB("insurance_company");

print("\n--- Connection / database checks ---");
check("Can run hello() against the cluster", function() {
    return db.hello().ok;
}, { equals: 1 });

check("insurance_company database is reachable", function() {
    return ic.getName();
}, { equals: "insurance_company" });

print("\n--- Collection existence ---");
var requiredCollections = [
    "branches", "policies", "customers", "agents", "claims", "payments"
];
var existing = ic.getCollectionNames();
requiredCollections.forEach(function(name) {
    check("Collection '" + name + "' exists", function() {
        return existing.indexOf(name) !== -1;
    }, { equals: true });
});

print("\n--- Document counts ---");
check("branches collection has at least 3 docs", function() {
    return ic.branches.countDocuments();
}, { min: 3 });

check("policies collection has at least 3 docs", function() {
    return ic.policies.countDocuments();
}, { min: 3 });

check("customers collection has at least 3 docs", function() {
    return ic.customers.countDocuments();
}, { min: 3 });

check("agents collection has at least 2 docs", function() {
    return ic.agents.countDocuments();
}, { min: 2 });

check("claims collection has at least 3 docs", function() {
    return ic.claims.countDocuments();
}, { min: 3 });

check("payments collection has at least 1 doc", function() {
    return ic.payments.countDocuments();
}, { min: 1 });

print("\n--- Key documents and shape checks ---");
check("At least one policy has policyNumber field", function() {
    return ic.policies.countDocuments({ policyNumber: { $exists: true } });
}, { min: 1 });

check("At least one customer has customerId field", function() {
    return ic.customers.countDocuments({ customerId: { $exists: true } });
}, { min: 1 });

check("At least one branch has a location (geo) field", function() {
    return ic.branches.countDocuments({ location: { $exists: true } });
}, { min: 1 });

check("At least one claim has claimNumber field", function() {
    return ic.claims.countDocuments({ claimNumber: { $exists: true } });
}, { min: 1 });

print("\n--- Index sanity ---");
check("policies has unique index on policyNumber", function() {
    var idxs = ic.policies.getIndexes();
    return idxs.some(function(i) {
        return i.key && i.key.policyNumber === 1 && i.unique === true;
    });
}, { equals: true });

check("customers has unique index on customerId", function() {
    var idxs = ic.customers.getIndexes();
    return idxs.some(function(i) {
        return i.key && i.key.customerId === 1 && i.unique === true;
    });
}, { equals: true });

print("\n=======================================================");
print("Summary: " + passed + " passed, " + failed + " failed");
if (failed > 0) {
    print("Failures:");
    failures.forEach(function(f) { print("  - " + f); });
    print("=======================================================");
    quit(1);
} else {
    print("ALL SANITY CHECKS PASSED");
    print("=======================================================");
    quit(0);
}
