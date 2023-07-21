import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'hardhat-deploy';
import '@nomiclabs/hardhat-ethers';

const accounts = [process.env.OWNER_KEY ?? ''];
const rpcUrl = (chain: string) => `https://rpc.ankr.com/${chain}/${process.env.ANKR_KEY}`;
const defaultDeployer = process.env.DEPLOYER ?? '';

const config: HardhatUserConfig = {
  solidity: "0.8.17",
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
    arbitrum: {
      url: rpcUrl('arbitrum'),
      accounts,
      chainId: 42161,
    },
    polygon: {
      url: rpcUrl('polygon'),
      accounts,
      chainId: 137,
    },
    mumbai: {
      url: 'https://rpc-mumbai.maticvigil.com',
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
