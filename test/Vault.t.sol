// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import {Test} from "forge-std/Test.sol";
import "forge-std/console.sol";
import {Vault} from "../contracts/core/Vault.sol";

contract VaultTest is Test {
    Vault public vault;
    address public TINU = 0xFf8acBd6c5BE49b8141c35c73163d5D6227dfC32;
    address public WETH = 0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9;
    address public from = 0xC5feaF9c4bac539c178bef3Aa55d05F4D22F2aBB;
    uint256 public amount = 100000000000000000;

    function setUp() public {
        vault = new Vault(TINU);
    }

    function test_MintWithoutApproval() public {
        vm.expectRevert("Vault: not allow");
        vault.increaseDebtFrom(from, WETH, amount, from);
    }

    function test_MintWithoutBalance() public {
        vm.startPrank(from);
        vault.approve(from, true);
        vm.expectRevert();
        vault.increaseDebtFrom(from, WETH, amount, from);
        vm.stopPrank();
    }
}
