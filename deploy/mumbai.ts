import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { setPriceFeed, setMinter, setTokenConfig } from '../scripts/action';
import { cyan } from '../scripts/colors';
import { deployAndLog } from '../scripts/deployAndLog';

export default async function deployToMumbai(hardhat: HardhatRuntimeEnvironment) {

    const { getNamedAccounts, ethers } = hardhat;
    const { deployer } = await getNamedAccounts();
    const wrapped = '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889';

    cyan('\nDeploying on Mumbai...\n');

    // UnitToken
    const unitToken = await deployAndLog('TinuToken', {
        from: deployer,
        args: [],
        skipIfAlreadyDeployed: true,
    });
    console.log("Tinu Token:", unitToken.address)

    // PriceFeed
    const unitPrice = await deployAndLog('UnitPriceFeed', {
        from: deployer,
        args: [],
        skipIfAlreadyDeployed: true,
    });
    console.log("Unit Price Feed:", unitPrice.address)

    // Vault
    const vault = await deployAndLog('Vault', {
        from: deployer,
        args: [unitToken.address],
        skipIfAlreadyDeployed: true,
    });
    console.log('vault:', vault.address)

    const vaultPriceFeed = await deployAndLog('VaultPriceFeed', {
        from: deployer,
        args: [],
        skipIfAlreadyDeployed: true,
    });

    // UnitRouterV1
    const unitRouterV1 = await deployAndLog('RouterV1', {
        from: deployer,
        args: [vault.address, wrapped, unitToken.address],
        skipIfAlreadyDeployed: true,
    });
    console.log('unitRouterV1:', unitRouterV1.address)

    await setPriceFeed(vaultPriceFeed.address);
    await setMinter(vault.address);
    await setTokenConfig(wrapped, unitPrice.address, 18);

}
