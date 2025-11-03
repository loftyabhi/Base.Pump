// Run this script to verify your contract addresses are correct
// node scripts/verify-contracts.js

const { createPublicClient, http } = require('viem');
const { base, baseSepolia } = require('viem/chains');

const Factory = require('../app/abis/Factory.json');

const addresses = {
  base: '0x7e43d21E5dCbcA9D11Bc37BcB7CDeb62d6D3bF3a',
  sepolia: '0xa8461707fcd642efce7d83e121a0ce059a671808'
};

async function verifyContract(chain, address) {
  console.log(`\n🔍 Checking ${chain.name}...`);
  console.log(`Address: ${address}`);
  
  try {
    const client = createPublicClient({
      chain,
      transport: http()
    });

    // Check if contract exists
    const code = await client.getcode({ address });
    
    if (!code || code === '0x') {
      console.log('❌ No contract found at this address');
      return false;
    }
    
    console.log('✅ Contract exists');

    // Try to read fee
    try {
      const fee = await client.readContract({
        address,
        abi: Factory,
        functionName: 'fee'
      });
      console.log(`✅ Fee: ${fee.toString()}`);
    } catch (error) {
      console.log('❌ Error reading fee:', error.message);
      return false;
    }

    // Try to read totalTokens
    try {
      const total = await client.readContract({
        address,
        abi: Factory,
        functionName: 'totalTokens'
      });
      console.log(`✅ Total tokens: ${total.toString()}`);
    } catch (error) {
      console.log('❌ Error reading totalTokens:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Verifying BasePump Factory Contracts...\n');
  
  const baseResult = await verifyContract(base, addresses.base);
  const sepoliaResult = await verifyContract(baseSepolia, addresses.sepolia);
  
  console.log('\n📊 Summary:');
  console.log(`Base Mainnet: ${baseResult ? '✅ Working' : '❌ Failed'}`);
  console.log(`Base Sepolia: ${sepoliaResult ? '✅ Working' : '❌ Failed'}`);
  
  if (!baseResult || !sepoliaResult) {
    console.log('\n⚠️  Some contracts failed verification.');
    console.log('Please check:');
    console.log('1. Contract addresses are correct');
    console.log('2. Contracts are deployed on the networks');
    console.log('3. ABI matches the deployed contracts');
  }
}

main().catch(console.error);