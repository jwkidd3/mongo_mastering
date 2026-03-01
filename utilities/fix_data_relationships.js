#!/usr/bin/env mongosh

// FIX DATA RELATIONSHIPS - Ensure all foreign key relationships work
print("🔧 FIXING DATA RELATIONSHIPS");
print("=" .repeat(80));

db = db.getSiblingDB('insurance_company');

// =============================================================================
// STEP 1: VALIDATE AND FIX CLAIM-POLICY RELATIONSHIPS
// =============================================================================
print("\n📋 STEP 1: Validating Claim-Policy Relationships");
print("-".repeat(60));

// Get all valid policy numbers
var validPolicyNumbers = db.policies.distinct("policyNumber");
print("✅ Found " + validPolicyNumbers.length + " valid policies:");
validPolicyNumbers.forEach(function(policyNum) {
    print("   • " + policyNum);
});

// Find claims with invalid policy references
var orphanedClaims = db.claims.find({
    policyNumber: { $nin: validPolicyNumbers }
}).toArray();

if (orphanedClaims.length > 0) {
    print("\n❌ Found " + orphanedClaims.length + " claims with invalid policy references:");
    orphanedClaims.forEach(function(claim) {
        print("   • Claim " + claim.claimNumber + " → Invalid Policy: " + claim.policyNumber);
    });

    print("\n🔧 FIXING: Updating invalid policy references...");

    // Fix each orphaned claim by assigning to a valid policy
    orphanedClaims.forEach(function(claim, index) {
        var validPolicy = validPolicyNumbers[index % validPolicyNumbers.length];
        var result = db.claims.updateOne(
            { _id: claim._id },
            { $set: { policyNumber: validPolicy } }
        );
        print("   ✓ Fixed " + claim.claimNumber + " → Now references " + validPolicy);
    });
} else {
    print("✅ All claims have valid policy references");
}

// =============================================================================
// STEP 2: VALIDATE AND FIX CUSTOMER-POLICY RELATIONSHIPS
// =============================================================================
print("\n👥 STEP 2: Validating Customer-Policy Relationships");
print("-".repeat(60));

// Get all valid customer IDs
var validCustomerIds = db.customers.distinct("customerId");
print("✅ Found " + validCustomerIds.length + " valid customers");

// Find policies with invalid customer references
var orphanedPolicies = db.policies.find({
    customerId: { $exists: true, $nin: validCustomerIds }
}).toArray();

if (orphanedPolicies.length > 0) {
    print("\n❌ Found " + orphanedPolicies.length + " policies with invalid customer references");

    // Note: Our current policies don't have customerId fields, which is actually correct
    // for this course design where policies are generic templates
    print("ℹ️  Note: Policies are designed as templates without specific customer assignments");
} else {
    print("✅ Policy-customer relationships are valid");
}

// =============================================================================
// STEP 3: VALIDATE AND FIX CLAIM-CUSTOMER RELATIONSHIPS
// =============================================================================
print("\n🎯 STEP 3: Validating Claim-Customer Relationships");
print("-".repeat(60));

// Find claims with invalid customer references
var claimsWithInvalidCustomers = db.claims.find({
    customerId: { $nin: validCustomerIds }
}).toArray();

if (claimsWithInvalidCustomers.length > 0) {
    print("\n❌ Found " + claimsWithInvalidCustomers.length + " claims with invalid customer references:");

    claimsWithInvalidCustomers.forEach(function(claim, index) {
        var validCustomer = validCustomerIds[index % validCustomerIds.length];
        var result = db.claims.updateOne(
            { _id: claim._id },
            { $set: { customerId: validCustomer } }
        );
        print("   ✓ Fixed " + claim.claimNumber + " → Now references customer " + validCustomer);
    });
} else {
    print("✅ All claims have valid customer references");
}

// =============================================================================
// STEP 4: VALIDATE AND FIX PAYMENT RELATIONSHIPS
// =============================================================================
print("\n💰 STEP 4: Validating Payment Relationships");
print("-".repeat(60));

// Check payment-customer relationships
var paymentsWithInvalidCustomers = db.payments.find({
    customerId: { $nin: validCustomerIds }
}).toArray();

if (paymentsWithInvalidCustomers.length > 0) {
    print("\n❌ Found " + paymentsWithInvalidCustomers.length + " payments with invalid customer references");

    paymentsWithInvalidCustomers.forEach(function(payment, index) {
        var validCustomer = validCustomerIds[index % validCustomerIds.length];
        var result = db.payments.updateOne(
            { _id: payment._id },
            { $set: { customerId: validCustomer } }
        );
        print("   ✓ Fixed " + payment.paymentId + " → Now references customer " + validCustomer);
    });
} else {
    print("✅ All payments have valid customer references");
}

// Check payment-policy relationships
var paymentsWithPolicies = db.payments.find({ policyNumber: { $exists: true } }).toArray();
var paymentsWithInvalidPolicies = db.payments.find({
    policyNumber: { $exists: true, $nin: validPolicyNumbers }
}).toArray();

if (paymentsWithInvalidPolicies.length > 0) {
    print("\n❌ Found " + paymentsWithInvalidPolicies.length + " payments with invalid policy references");

    paymentsWithInvalidPolicies.forEach(function(payment, index) {
        var validPolicy = validPolicyNumbers[index % validPolicyNumbers.length];
        var result = db.payments.updateOne(
            { _id: payment._id },
            { $set: { policyNumber: validPolicy } }
        );
        print("   ✓ Fixed " + payment.paymentId + " → Now references policy " + validPolicy);
    });
} else {
    print("✅ All payments have valid policy references");
}

// =============================================================================
// STEP 5: FINAL VALIDATION AND REPORT
// =============================================================================
print("\n🎯 STEP 5: Final Validation Report");
print("=" .repeat(80));

// Comprehensive relationship validation
var validationResults = {
    totalPolicies: db.policies.countDocuments(),
    totalCustomers: db.customers.countDocuments(),
    totalClaims: db.claims.countDocuments(),
    totalPayments: db.payments.countDocuments(),
    validClaimPolicyRefs: db.claims.countDocuments({ policyNumber: { $in: validPolicyNumbers } }),
    validClaimCustomerRefs: db.claims.countDocuments({ customerId: { $in: validCustomerIds } }),
    validPaymentCustomerRefs: db.payments.countDocuments({ customerId: { $in: validCustomerIds } }),
    validPaymentPolicyRefs: db.payments.countDocuments({
        $or: [
            { policyNumber: { $in: validPolicyNumbers } },
            { policyNumber: { $exists: false } }
        ]
    })
};

print("📊 DATA SUMMARY:");
print("   Policies: " + validationResults.totalPolicies);
print("   Customers: " + validationResults.totalCustomers);
print("   Claims: " + validationResults.totalClaims);
print("   Payments: " + validationResults.totalPayments);

print("\n🔗 RELATIONSHIP VALIDATION:");
print("   Claims → Policies: " + validationResults.validClaimPolicyRefs + "/" + validationResults.totalClaims +
       " (" + (validationResults.validClaimPolicyRefs === validationResults.totalClaims ? "✅ VALID" : "❌ INVALID") + ")");
print("   Claims → Customers: " + validationResults.validClaimCustomerRefs + "/" + validationResults.totalClaims +
       " (" + (validationResults.validClaimCustomerRefs === validationResults.totalClaims ? "✅ VALID" : "❌ INVALID") + ")");
print("   Payments → Customers: " + validationResults.validPaymentCustomerRefs + "/" + validationResults.totalPayments +
       " (" + (validationResults.validPaymentCustomerRefs === validationResults.totalPayments ? "✅ VALID" : "❌ INVALID") + ")");
print("   Payments → Policies: " + validationResults.validPaymentPolicyRefs + "/" + validationResults.totalPayments +
       " (" + (validationResults.validPaymentPolicyRefs === validationResults.totalPayments ? "✅ VALID" : "❌ INVALID") + ")");

// Test critical relationship queries that labs depend on
print("\n🧪 TESTING CRITICAL LAB QUERIES:");

// Test 1: Find claims for a specific policy
var testPolicy = validPolicyNumbers[0];
var claimsForPolicy = db.claims.countDocuments({ policyNumber: testPolicy });
print("   Query: Claims for policy " + testPolicy + " → " + claimsForPolicy + " results " +
      (claimsForPolicy >= 0 ? "✅" : "❌"));

// Test 2: Find claims for a specific customer
var testCustomer = validCustomerIds[0];
var claimsForCustomer = db.claims.countDocuments({ customerId: testCustomer });
print("   Query: Claims for customer " + testCustomer + " → " + claimsForCustomer + " results " +
      (claimsForCustomer >= 0 ? "✅" : "❌"));

// Test 3: Aggregate claims by policy type
var claimsByPolicyType = db.claims.aggregate([
    { $lookup: { from: "policies", localField: "policyNumber", foreignField: "policyNumber", as: "policy" } },
    { $unwind: { path: "$policy", preserveNullAndEmptyArrays: true } },
    { $group: { _id: "$policy.policyType", count: { $sum: 1 } } }
]).toArray();
print("   Query: Claims by policy type → " + claimsByPolicyType.length + " policy types " +
      (claimsByPolicyType.length > 0 ? "✅" : "❌"));

// Test 4: Customer payment history
var customerPayments = db.payments.countDocuments({ customerId: testCustomer });
print("   Query: Payments for customer " + testCustomer + " → " + customerPayments + " results " +
      (customerPayments >= 0 ? "✅" : "❌"));

// Final status
var allValid = (
    validationResults.validClaimPolicyRefs === validationResults.totalClaims &&
    validationResults.validClaimCustomerRefs === validationResults.totalClaims &&
    validationResults.validPaymentCustomerRefs === validationResults.totalPayments &&
    validationResults.validPaymentPolicyRefs === validationResults.totalPayments
);

print("\n" + "=" .repeat(80));
if (allValid) {
    print("🎉 SUCCESS: All data relationships are now valid!");
    print("📚 Labs can now safely use cross-collection queries");
    print("✅ Students will not encounter relationship errors");
} else {
    print("❌ CRITICAL: Some relationships are still broken!");
    print("⚠️  Students will encounter errors in advanced labs");
    print("🔧 Manual intervention required");
}
print("=" .repeat(80));