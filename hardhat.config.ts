import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'hardhat-deploy';
import '@nomiclabs/hardhat-ethers';

const accounts = [process.env.OWNER_KEY ?? 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'];
const rpcUrl = (chain: string) => `https://rpc.ankr.com/${chain}/${process.env.ANKR_KEY}`;

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
      url: rpcUrl('polygon_mumbai'),
      accounts,
      gasPrice: 55000000000,
      chainId: 80001,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
      sepolia: '0x92A2E7BA8446400C7407275e8Dc1FDAcED30E2Cf',
      mumbai: '0x92A2E7BA8446400C7407275e8Dc1FDAcED30E2Cf',
    },
  },
};

export default config;
