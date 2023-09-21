import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { cyan, green, yellow, dim } from '../scripts/colors';
import { setPriceFeed, setMinter, setTokenConfig, setMultiplier } from '../scripts/action';

function displayResult(name: string, result: any) {
  if (!result.newlyDeployed) {
    yellow(`Re-used existing ${name} at ${result.address}`);
  } else {
    green(`${name} deployed at ${result.address}`);
  }
}

const chainName = (chainId: number) => {
  switch (chainId) {
    case 1:
      return 'Mainnet';
    case 11155111:
      return 'Sepolia';
    case 42161:
      return 'Arbitrum';
    case 420:
      return 'Optimism Goerli';
    case 10:
      return 'Optimism';
    case 421613:
      return 'Arbitrum Goerli';
    case 56:
      return 'Binance Smart Chain';
    case 97:
      return 'Binance Smart Chain (testnet)';
    case 137:
      return 'Matic';
    case 80001:
      return 'Matic (Mumbai)';
    default:
      return 'Unknown';
  }
};

const wrapped = (chainId: number) => {
  switch (chainId) {
    case 11155111:
      return '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9';
    case 80001:
      return '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889';
    default:
      return '';
  }
};

module.exports = async (hardhat: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts, deployments, getChainId, ethers } = hardhat;
  const { deploy } = deployments;

  let { deployer } = await getNamedAccounts();
  const chainId = parseInt(await getChainId(), 10);
  // @ts-ignore
  const signer = await ethers.provider.getSigner(deployer);
  console.log('Deployment signer address', (await signer.getAddress()));
  const deploymentSignerInitialNonce = await signer.getNonce();
  console.log('Deployment nonce', deploymentSignerInitialNonce);
  // @ts-ignore
  const gasData = await ethers.provider.getFeeData();
  // @ts-ignore
  const latestBlock = await ethers.provider.getBlock("latest");

  // 31337 is unit testing, 1337 is for coverage
  const isTestEnvironment = chainId === 31337 || chainId === 1337;

  dim('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  dim('UNIT Vault Contracts - Deploy Script');
  dim('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');

  dim(`Network: ${chainId} - ${chainName(chainId)} (${isTestEnvironment ? 'local' : 'remote'})`);
  dim(`Deployer: ${deployer}`);

  cyan(`\nDeploying TINU Token...`);
  const tinuTokenResult = await deploy('TinuToken', {
    from: deployer,
  });
  displayResult('TINU Token', tinuTokenResult);

  yellow('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');

  cyan('\nDeploying UnitPriceFeed...');
  const unitPriceResult = await deploy('UnitPriceFeed', {
    from: deployer,
  });

  displayResult('UnitPriceFeed', unitPriceResult);

  yellow('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');

  cyan('\nDeploying Vault...');
  const vaultResult = await deploy('Vault', {
    from: deployer,
    args: [tinuTokenResult.address],
  });

  displayResult('Vault', vaultResult);

  yellow('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');

  cyan('\nDeploying VaultPriceFeed...');
  const vaultPriceFeedResult = await deploy('VaultPriceFeed', {
    from: deployer,
  });

  displayResult('VaultPriceFeed', vaultPriceFeedResult);

  yellow('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');

  cyan('\nDeploying RouterV1...');
  const routerResult = await deploy('RouterV1', {
    from: deployer,
    args: [vaultResult.address, wrapped(chainId), tinuTokenResult.address],
  });

  displayResult('RouterV1', routerResult);

  yellow('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');

  cyan('\nSet price feed for vault...');
  await setPriceFeed(vaultPriceFeedResult.address);

  yellow('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');

  cyan('\nSet minter for vault...');
  await setMinter(vaultResult.address);

  yellow('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');

  cyan('\nSet token config for price feed...');
  await setTokenConfig(wrapped(chainId), unitPriceResult.address, 18);

  const un = '0x101627e8e52f627951BBdEC88418B131eE890cbE';

  const farm = await deploy('Farm', {
    from: deployer,
    args: [
      '172800',
      '1000000000000000000000',
      latestBlock.number,
      un
    ],
  });

  displayResult('Farm', farm)

  yellow('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');

  cyan('\nSet Multipliers for farm...');

  await setMultiplier(1, 3, 6, 10)

  dim('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  green('Contract Deployments Complete!');
  dim('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
};