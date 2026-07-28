#!/bin/bash
# NightSignals deploy on Hostinger VPS
# Run this from ~/nightsignals after cloning

set -e

echo "=== NightSignals Deploy to Midnight Preprod ==="

# 1. Install deps
npm install

# 2. Patch wallet SDK — fix .values().map() bug
CORE_WALLET="node_modules/@midnight-ntwrk/wallet-sdk-shielded/dist/v1/CoreWallet.js"
sed -i 's/state.pendingOutputs.values().map/([...state.pendingOutputs.values()]).map/' "$CORE_WALLET"
echo "✓ patched CoreWallet.js"

# 3. Patch wallet facade — skip shielded sync for deploy
FACADE="node_modules/@midnight-ntwrk/wallet-sdk-facade/dist/index.js"
sed -i 's/this.shielded.waitForSyncedState(),//' "$FACADE"
echo "✓ patched wallet facade"

# 3b. Patch unshielded + dust wallet — accept large sync gap
UNSHIELDED="node_modules/@midnight-ntwrk/wallet-sdk-unshielded-wallet/dist/UnshieldedWallet.js"
sed -i 's/waitForSyncedState(allowedGap = 0n)/waitForSyncedState(allowedGap = 100000n)/' "$UNSHIELDED"
DUST="node_modules/@midnight-ntwrk/wallet-sdk-dust-wallet/dist/DustWallet.js"
sed -i 's/waitForSyncedState(allowedGap = 0n)/waitForSyncedState(allowedGap = 100000n)/' "$DUST"
echo "✓ patched sync gaps"

# 4. Restore wallet seed (create from env var or use MIDNIGHT_WALLET_SEED)
if [ -n "$MIDNIGHT_WALLET_SEED" ]; then
  cat > .midnight-state.json << SEEDEOF
{
  "version": 1,
  "activeNetwork": "preprod",
  "wallets": {
    "preprod": {
      "seed": "$MIDNIGHT_WALLET_SEED",
      "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
    }
  },
  "deployments": {}
}
SEEDEOF
  echo "✓ wallet seed restored from MIDNIGHT_WALLET_SEED"
else
  echo "⚠ Set MIDNIGHT_WALLET_SEED env var to your wallet seed"
  exit 1
fi

# 5. Start proof server
docker compose up -d --wait proof-server
echo "✓ proof server running"

# 6. Deploy
echo "=== Deploying... ==="
npm run deploy -- -- --network preprod

echo ""
echo "=== Done ==="
echo "Contract address saved in .midnight-state.json"
cat .midnight-state.json | grep -o '"address": "[^"]*"'
