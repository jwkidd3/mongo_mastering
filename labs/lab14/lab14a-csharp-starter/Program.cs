using Microsoft.Extensions.Configuration;
using InsuranceManagementSystem.Models;
using InsuranceManagementSystem.Services;

class Program
{
    static async Task Main(string[] args)
    {
        Console.WriteLine("Insurance Management System - MongoDB C# Driver");
        Console.WriteLine("=================================================\n");

        // Load connection settings from appsettings.json (and env vars if set).
        var config = new ConfigurationBuilder()
            .SetBasePath(AppContext.BaseDirectory)
            .AddJsonFile("appsettings.json", optional: false)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = config["MongoDB:ConnectionString"]
            ?? "mongodb://localhost:27017/?directConnection=true";
        var databaseName = config["MongoDB:DatabaseName"] ?? "insurance_company_csharp";

        try
        {
            // Connection setup is done for you.
            var mongoService = new MongoDBService(connectionString, databaseName);
            var policyService = new PolicyService(mongoService);

            Console.WriteLine($"Connected to {databaseName}.\n");

            // TODO (students): exercise your service layer here. For example:
            //
            //   var policy = new Policy { PolicyNumber = "AUTO-001", ... };
            //   await policyService.CreatePolicyAsync(policy);
            //
            //   var all = await policyService.GetAllPoliciesAsync();
            //   foreach (var p in all)
            //       Console.WriteLine($"- {p.PolicyNumber}");
            //
            //   var stats = await policyService.GetPolicyStatsByTypeAsync();
            //   foreach (var s in stats) Console.WriteLine(s);

            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
            Console.WriteLine(ex.StackTrace);
        }

        Console.WriteLine("\nDone.");
    }
}
