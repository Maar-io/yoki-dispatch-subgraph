const path = require("path");
const fs = require("fs");


const OUTPUT = path.resolve(__dirname, "../output")

async function main() {
    const files = await fs.promises.readdir(OUTPUT);
    let allAddressObj = {};
    let totalAmount = 0;

    for (const file of files) {
        console.log(`Reading file ${file}`)
        // Get the full paths
        const filePath = path.join(OUTPUT, file);
        // Stat the file to see if we have a file or dir
        const stat = await fs.promises.stat(filePath);
        if (stat.isFile()) {
            const csvData = (await fs.promises.readFile(filePath, { encoding: "utf-8" })).split("\n");
            for (const line of csvData) {
                const [address, amount] = line.split(",")
                totalAmount += Number(amount)
                const addressData = allAddressObj[address.toLowerCase()];

                if (!addressData) {
                    allAddressObj[address.toLowerCase()] = Number(amount)
                } else {
                    allAddressObj[address.toLowerCase()] = addressData + Number(amount)
                }
            }
        } else { continue }
    }

    let allAddress = []
    for (const addr in allAddressObj) {
        allAddress.push([addr.replaceAll('"', ""), allAddressObj[addr]])
    }
    allAddress.sort((a, b) => b[1] - a[1]);


    fs.writeFileSync(path.resolve(__dirname, "../output.json"), JSON.stringify(allAddress.map(([address, value]) => ({
        address, value
    })), null, 2))
    console.log(`totalOma=${totalAmount}, totalAddress=${allAddress.length}`)
}


main().then(() => process.exit(0)).catch((e) => {
    console.error(e);
    process.exit(1);
})