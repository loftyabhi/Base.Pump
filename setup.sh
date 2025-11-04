#!/bin/bash
echo "🚀 Setting up Base.Pump locally..."

# 1️⃣ Install dependencies
npm install

# 2️⃣ Copy env template if not exists
if [ ! -f .env.local ]; then
  echo "Creating .env.local..."
  cat > .env.local <<EOL
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_here
PINATA_API_KEY=your_pinata_api_key_here
PINATA_API_SECRET=your_pinata_api_secret_here
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_onchainkit_key_here
NEXT_PUBLIC_NEYNAR_API_KEY=your_neynar_key_here
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_key_here
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_id_here
EOL
fi

echo "✅ Setup complete!"
echo "👉 Run: npm run dev"
