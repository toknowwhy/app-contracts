import { ethers } from 'hardhat'
import { cyan, green } from './colors'
import { Contract } from 'ethers';

export async function setPriceFeed(priceFeed: string, contract?: Contract) {
    if (!contract) {
        contract = await (ethers as any).getContract('Vault')
    }
    cyan('\nSetting price feed on vault...')
    const tx = await contract!.setPriceFeed(priceFeed);
    await tx.wait(1)
    green(`Vault price feed set!`)
}

export async function setMinter(vault: string, contract?: Contract) {
    if (!contract) {
        contract = await (ethers as any).getContract('TinuToken')
    }
    cyan('\nSetting minter on TINU...')
    const tx = await contract!.setMinter(vault);
    await tx.wait(1)
    green(`TINU Minter set!`)
}

export async function setTokenConfig(wrapped: string, priceFeed: string, decimals: number, contract?: Contract) {
    if (!contract) {
        contract = await (ethers as any).getContract('VaultPriceFeed')
    }
    cyan('\nSetting token config on vault price feed...')
    const tx = await contract!.setTokenConfig(wrapped, priceFeed, decimals);
    await tx.wait(1)
    green(`Vault price feed token config set!`)
}
