import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'hardhat-deploy';
import '@nomiclabs/hardhat-ethers';
import "@nomicfoundation/hardhat-foundry";

const accounts = [process.env.OWNER_KEY ?? ''];
const rpcUrl = (chain: string) => `https://rpc.ankr.com/${chain}/${process.env.ANKR_KEY}`;
const defaultDeployer = process.env.DEPLOYER ?? '';

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY ?? '',
      polygonMumbai: process.env.POLYGONSCAN_API_KEY ?? '',
    }
  },
  networks: {
    localhost: {
      chainId: 31337,
    },
    sepolia: {
      url: rpcUrl('eth_sepolia'),
      accounts,
      chainId: 11155111,
    },
    mainnet: {
      url: rpcUrl('eth'),
      accounts,
      chainId: 1,
    },
    optimism: {
      url: rpcUrl('optimism'),
      accounts,
      chainId: 10,
    },
    arbitrum: {
      url: rpcUrl('arbitrum'),
      accounts,
      chainId: 42161,
    },
    arbitrumGoerli: {
      url: 'https://endpoints.omniatech.io/v1/arbitrum/goerli/public',
      accounts,
      chainId: 421613,
    },
    optimismGoerli: {
      url: 'https://goerli.optimism.io',
      accounts,
      chainId: 420,
    },
    polygon: {
      url: rpcUrl('polygon'),
      accounts,
      chainId: 137,
    },
    mumbai: {
      url: rpcUrl('polygon_mumbai'),
      accounts,
      chainId: 80001,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
      sepolia: defaultDeployer,
      mumbai: defaultDeployer,
    },
  },
};

export default config;
