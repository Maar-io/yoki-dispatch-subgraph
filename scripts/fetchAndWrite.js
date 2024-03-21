const axios = require("axios");
const fs = require("fs");
const { Parser } = require("json2csv");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchAndWrite = async (
  contractAddress,
  omaNumber,
  compensateOma,
  fileName,
  block_gt,
  block_lt
) => {
  let totalResults = 0;
  let csvData = [];
  const GRAPH_ENDPOINT =
    "https://api.studio.thegraph.com/proxy/64002/yokidispatch/version/latest";

  const fetchPage = async (skip) => {
    const response = await axios.post(GRAPH_ENDPOINT, {
      query: `
                query MyQuery($first: Int, $skip: Int) {
                    multiMinteds(
                            first: $first,
                            skip: $skip,
                            where: {
                                partnerNftContract: "${contractAddress}",
                                omaAmount: "${omaNumber}"
                                blockNumber_gt: "${block_gt}"
                                blockNumber_lte: "${block_lt}"
                            }
                        ) {
                            to
                    }
                }
            `,
      variables: {
        first: 100,
        skip: skip,
      },
    });

    if (response.data != undefined && response.data.data != undefined) {
    //   console.log(`fetching page ${skip / 100} ${response.data.data.length}`);
      const mintedData = response.data.data.multiMinteds;
    //   console.log(mintedData);
      totalResults += mintedData.length;
      csvData = csvData.concat(mintedData);
    //   console.log(`total (${totalResults}), in page ${mintedData.length}`);

      if (mintedData.length > 0) {
        await delay(200); // wait for 1 second
        await fetchPage(skip + 100);
      }
    } else {
      console.log("No more data to fetch.");
    }
  };

  await fetchPage(0);
  console.log(
    `(${totalResults}) ${fileName}: issued ${omaNumber} OMA, compensate ${compensateOma} OMA`
  );
  csvData = csvData.map((item) => [item.to, compensateOma]);
  const json2csvParser = new Parser({ header: false });

  const csv = json2csvParser.parse(csvData);

  fs.writeFile(`output/${fileName}.csv`, csv, function (err) {
    if (err) throw err;
  });
};

module.exports = fetchAndWrite;
