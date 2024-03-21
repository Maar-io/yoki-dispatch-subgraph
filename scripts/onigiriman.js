const axios = require('axios');
const fs = require('fs');
const { Parser } = require('json2csv');

let totalResults = 0;
let csvData = [];
const GRAPH_ENDPOINT = 'https://api.studio.thegraph.com/proxy/64002/yokidispatch/version/latest';

const OMAS = 3;
const COMPENSATE = 3;
let fileName = "onigiriman" + String(OMAS)

const fetchPage = async (skip) => {
    const response = await axios.post(GRAPH_ENDPOINT, {
        query: `
            query MyQuery($first: Int, $skip: Int) {
                multiMinteds(
                        first: $first,
                        skip: $skip,
                        where: {
                            partnerNftContract: "0x0CFd649E37882944342Ec0f8A2ac8ABca01f6934",
                            omaAmount: "${OMAS}"
                        }
                    ) {
                        to
                   }
                }
        `,
        variables: {
            first: 100,
            skip: skip
        }
    });

    const values = response.data.data.multiMinteds;
    totalResults += values.length;
    csvData = csvData.concat(values);

    if (values.length > 0) {
        await fetchPage(skip + 100);
    }
};

fetchPage(0).then(() => {
    console.log(`${fileName}:issued ${OMAS} OMA:`, totalResults);
    const json2csvParser = new Parser({ fields: ['to'], header: false });
    const csv = json2csvParser.parse(csvData);

    fs.writeFile(`output/${fileName}.csv`, csv, function(err) {
        if (err) throw err;
        console.log(`${fileName} saved`);
    });
}).catch(console.error);