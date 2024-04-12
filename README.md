
## 1. Consolidate Script -  `scripts/consolidate.js`
This script simply consolidate all the csv outputs produced in `output/` and aggregate them into a single consumable file compatible with compensate script.
Output path - `./output.json` 
```
node scripts/index.js && node scripts/consolidate.js
```

## 2. Compensation Script - `scripts/sendOma.ts`
This script will read the compensation data produced by `consolidate.js` script and compensate users while keeping track of pending transactions.
Script behaviour,
- It reads the compensation data (produced from `consolidate.js`) from `scripts/compensation_data.json`  and modifies it in-place to keep track of progress.
- It maintains a cursor for pending tx and recovers from it in case of crash like RPC error.
- It uses a separate wallet instead of yoki admin for security and use `safeTransferFrom()` to compensate users. That means the wallet in use must have all the OMAs in balance before starting script. 
- If connected to a local node it runs in fork mode for testing

**Procedure to run the script**
1. Create new wallet (filled with ETH) and fill .env
   ```bash
   PRIVATE_KEY=
   # use gelato rpc, it's more stable
   RPC_URL=
   ```
1. `node scripts/index.js && node scripts/consolidate.js`
   - This will produce `output.json` file, copy it to `scripts/compensation_data.json` 
      ```
      ...
      Reading file sashimi3.csv
      Reading file uzno1.csv
      totalOma=10376, totalAddress=1414
      ```
   - It'll also print total oma to compensate, ask yoki private key holder to mint that amount to the wallet create earlier using `adminMint(to, 0, 10376)`
3. Run the script - `yarn compensate`
   - It'll start processing compensation.
   - If script fails/abort due to any reason, just re-run it, it'll resume while making sure not to double compensate anyone.
   - **NOTE**: Do not modify `scripts/compensation_data.json` and `scripts/.pending`, they are used to keep track of state

### Cost
Gas used for single tx - 47478
Gas Price - 0.5 Gwei (this is an upper estimation)
Total Tx - 1414

Total ETH = (47478 * 1414 * 0.5) gwei = **0.033566946 ETH** (~120 USD)

### Total Time
Assuming each tx takes 6 sec (rpc lag and 0.5s wait), it'll take 2hr 18minutes
