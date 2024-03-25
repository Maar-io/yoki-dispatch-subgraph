import path from "path";
import fs from "fs";
import "dotenv/config";
import {
  ContractTransactionResponse,
  TransactionReceipt,
  ethers,
} from "ethers";
import assert from "assert";

///
/// ENV Variables - Start
///
const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) throw new Error("PRIVATE_KEY is null");
const RPC_URL = process.env.RPC_URL || "http://localhost:8545";
///
/// ENV Variables - End
///

// The output path for saving data to keep track of already
// completed compensation.
const OUTPUT = path.resolve(__dirname, "compensation_data.json");
const CURSOR_PATH = path.resolve(__dirname, ".pending");

const YOKI_ABI = [
  "function safeTransferFrom(address from, address to, uint256 tokenId, uint256 value, bytes data)",
  "function balanceOf(address owner, uint256 id) view returns (uint256)",
  "function adminMint(address to, uint256 id, uint256 amount)",
];

const PROVIDER = new ethers.JsonRpcProvider(RPC_URL);
const WALLET = new ethers.Wallet(PRIVATE_KEY, PROVIDER);
const YOKI = new ethers.Contract(
  "0x2e6ff2a374844ed25E4523da53292a89B93e8905",
  YOKI_ABI,
  PROVIDER
);

async function processCompensation(
  item: CompensationStatus
): Promise<TransactionReceipt> {
  const cursor = readCursor();
  if (cursor) {
    console.log(
      `Pending tx found for ${item.address} - ${cursor.result.txHash}`
    );
    ///
    /// script crashed, handle pending transaction
    ///
    assert(
      cursor.address === item.address,
      `Output (${item.address}) and cursor (${cursor.address}) mismatch`
    );
    let txResult: TransactionReceipt | null = null;

    // Wait for tx to confirm for 10s, if not then most likely stuck, will need
    // to handle manually
    for (let i = 0; i < 10; i++) {
      txResult = await PROVIDER.getTransactionReceipt(cursor.result.txHash);
      if (txResult) break;
      await sleep(1000);
    }

    if (!txResult) {
      throw new Error(
        `The pending tx - ${cursor.result.txHash} is not resolved after 10s. Check it mannually and remove the cursor file afterwards.`
      );
    }

    // delete cursor
    writeCursor(null);
    return txResult;
  } else {
    ///
    /// process normally
    ///
    const txResponse: ContractTransactionResponse = await YOKI.connect(
      WALLET
    ).getFunction("safeTransferFrom")(
      WALLET.address,
      item.address,
      0,
      item.value,
      "0x"
    );

    // write cursor
    writeCursor({
      ...item,
      result: {
        txHash: txResponse.hash,
      },
    });
    // wait for tx to confirm
    const txResult = await txResponse.wait();
    // delete cursor
    writeCursor(null);
    return txResult!;
  }
}

async function main() {
  console.log("Script started");
  const compensationData: CompensationStatus[] = JSON.parse(
    readFileIfExists(OUTPUT, "[]")
  );

  // filter out the completed
  const remaining = compensationData.filter((s) => !s.result);
  console.log(
    `Total ${remaining.length}/${compensationData.length} compensation remaing to process`
  );

  // setup for forking if local network
  await setupForking(remaining);
  //sanity checks
  await sanityChecks(remaining);

  for (let i = 0; i < compensationData.length; i++) {
    const item = compensationData[i];
    if (item.result) {
      console.log(
        `Already processed compensation for ${item.address} (index ${i}/${compensationData.length}). Skipping`
      );
      continue;
    }

    // process compensation
    console.log(
      `Started processing of ${item.address} (index ${i}/${compensationData.length})`
    );
    const txResult = await processCompensation(item);

    // save output
    compensationData[i] = {
      ...compensationData[i],
      result: {
        txHash: txResult!.hash,
        gasCost: txResult?.gasUsed.toString(),
        gasPrice: txResult?.gasPrice.toString(),
      },
    };
    writeOutput(compensationData);

    // sleep for 0.5s to prevent rate limit
    sleep(500);
  }
}

///
/// Helper Methods
///

function readCursor(): Cursor | undefined {
  const data = readFileIfExists(CURSOR_PATH);
  if (data) {
    return JSON.parse(data);
  }
  return undefined;
}

function writeCursor(cursor: Cursor | null) {
  if (cursor) {
    fs.writeFileSync(CURSOR_PATH, JSON.stringify(cursor, null, 2));
  } else {
    fs.unlinkSync(CURSOR_PATH);
  }
}

function writeOutput(proccessed: CompensationStatus[]) {
  fs.writeFileSync(OUTPUT, JSON.stringify(proccessed, null, 2));
}

async function setupForking(remaining: CompensationStatus[]) {
  if (RPC_URL.includes("localhost") || RPC_URL.includes("127.0.0.1")) {
    console.log("Setting up for fork testing");

    const adminAddr = "0xfdaCcDB6C0021C994bd43B82a698f7aFb0860b78";
    // impersonate admin role account
    await PROVIDER.send("hardhat_impersonateAccount", [adminAddr]);
    const admin = await PROVIDER.getSigner(adminAddr);

    // mint
    const totalOma = remaining.reduce(
      (agg, curr) => agg + BigInt(curr.value),
      BigInt(0)
    );
    const balanceOma: bigint = await YOKI.balanceOf(WALLET, 0);

    if (totalOma > balanceOma) {
      await (
        await YOKI.connect(admin).getFunction("adminMint")(
          WALLET.address,
          0,
          totalOma - balanceOma
        )
      ).wait();
      console.log(`Minted ${totalOma - balanceOma} OMA`);
    }
  }
}

async function sanityChecks(remaining: CompensationStatus[]) {
  const totalOma = remaining.reduce(
    (agg, curr) => agg + BigInt(curr.value),
    BigInt(0)
  );
  const balanceOma: bigint = await YOKI.balanceOf(WALLET, 0);
  assert(
    balanceOma >= totalOma,
    `Total OMA (${totalOma}) is less than account balance (${balanceOma})`
  );
}

function readFileIfExists<T extends string | undefined>(
  path: string,
  fallback?: T
): T extends string ? string : undefined {
  if (fs.existsSync(path)) {
    return fs.readFileSync(path, { encoding: "utf8" }) as any;
  }
  return fallback as any;
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

type Cursor = Required<Pick<CompensationStatus, "result">> & CompensationStatus;

interface CompensationStatus {
  address: string;
  value: string;
  result?: {
    txHash: string;
    gasCost?: string;
    gasPrice?: string;
  };
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
