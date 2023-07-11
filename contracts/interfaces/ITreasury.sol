// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface ITreasury {
    function poolAmounts(address) external view returns(uint256);
}
