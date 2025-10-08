// Test script to debug channel sync issues
// Run with: node scripts/test-sync.js

const testChannelSync = async () => {
  const channelId = "a68d0d51-4766-48aa-bfa5-11c3c20bf543"; // Your channel ID from the error
  
  console.log("Testing channel sync for ID:", channelId);
  
  try {
    // Test sync orders
    console.log("\n--- Testing Order Sync ---");
    const orderResponse = await fetch(`http://localhost:3000/api/shopify/sync-orders?channelId=${channelId}`, {
      method: "POST",
    });
    
    const orderData = await orderResponse.json();
    console.log("Order sync response:", orderData);
    console.log("Order sync status:", orderResponse.status);
    
    // Test sync inventory
    console.log("\n--- Testing Inventory Sync ---");
    const inventoryResponse = await fetch(`http://localhost:3000/api/shopify/sync-inventory?channelId=${channelId}`, {
      method: "POST",
    });
    
    const inventoryData = await inventoryResponse.json();
    console.log("Inventory sync response:", inventoryData);
    console.log("Inventory sync status:", inventoryResponse.status);
    
  } catch (error) {
    console.error("Test failed:", error);
  }
};

// Only run if this script is executed directly
if (require.main === module) {
  testChannelSync();
}

module.exports = { testChannelSync };
