const fs = require("fs");
const path = require("path");

const sepoliaDeployments = path.join(__dirname, '..', 'deployments/sepolia')
const mumbaiDeployments = path.join(__dirname, '..', 'deployments/mumbai')

const networkDeploymentPaths = [sepoliaDeployments, mumbaiDeployments];

const CURRENT_VERSION = {
  major: 1,
  minor: 0,
  patch: 0,
};

const contractList = {
  name: "Testnet Vault",
  version: CURRENT_VERSION,
  contracts: {},
};

const formatContract = (deploymentBlob) => {
  return {
    address: deploymentBlob.address,
    abi: deploymentBlob.abi,
  };
};

networkDeploymentPaths.forEach((networkDeploymentPath) => {
  const contractDeploymentPaths = fs
    .readdirSync(networkDeploymentPath)
    .filter((path) => path.endsWith(".json"));
  const chainId = Number(
    fs.readFileSync(`${networkDeploymentPath}/.chainId`, "utf8")
  );

  contractDeploymentPaths.forEach((contractDeploymentFileName) => {
    if (!contractList.contracts[chainId]) {
      contractList.contracts[chainId] = {}
    }
    const contractName = contractDeploymentFileName.split(".")[0];
    const contractDeployment = JSON.parse(
      fs.readFileSync(
        `${networkDeploymentPath}/${contractDeploymentFileName}`,
        "utf8"
      )
    );
    contractList.contracts[chainId][contractName] = formatContract(contractDeployment);
  });
});

fs.writeFile(
  `${__dirname}/../../theunit-frontend/crypto/contracts.json`,
  JSON.stringify(contractList),
  (err) => {
    if (err) {
      console.error(err);
      return;
    }
  }
);
