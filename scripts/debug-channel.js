// Debug script to check channel credentials
// Run with: node scripts/debug-channel.js

const debugChannelCredentials = async () => {
  const channelId = "a68d0d51-4766-48aa-bfa5-11c3c20bf543";
  
  console.log("=== Channel Credentials Debug ===");
  console.log("Channel ID:", channelId);
  
  try {
    // Test the API endpoint to see what credentials are being used
    const response = await fetch(`http://localhost:3000/api/shopify/sync-inventory?channelId=${channelId}`, {
      method: "POST",
    });
    
    const data = await response.json();
    console.log("Response status:", response.status);
    console.log("Response data:", data);
    
    if (response.status === 400 && data.error?.includes("Invalid Shopify credentials")) {
      console.log("\n❌ ISSUE FOUND: Invalid Shopify credentials");
      console.log("The channel credentials are missing or malformed.");
      console.log("Please check:");
      console.log("1. The channel exists in your database");
      console.log("2. The api_credentials field contains valid Shopify data");
      console.log("3. The credentials include 'shop_url' and 'access_token'");
    }
    
  } catch (error) {
    console.error("Debug failed:", error.message);
  }
};

// Only run if this script is executed directly
if (require.main === module) {
  debugChannelCredentials();
}

module.exports = { debugChannelCredentials };
