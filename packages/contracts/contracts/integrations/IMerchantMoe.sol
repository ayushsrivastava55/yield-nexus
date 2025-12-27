// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IMerchantMoe
 * @notice Interface for Merchant Moe DEX on Mantle
 * @dev Liquidity Book (LB) pool interface for price fetching and swaps
 */
interface ILBPair {
    function getActiveId() external view returns (uint24 activeId);
    function getBinStep() external pure returns (uint16);
    function getTokenX() external pure returns (address tokenX);
    function getTokenY() external pure returns (address tokenY);
    function getReserves() external view returns (uint128 reserveX, uint128 reserveY);
    function swap(bool swapForY, address to) external returns (bytes32 amountsOut);
}

interface ILBRouter {
    struct Path {
        uint256[] pairBinSteps;
        address[] tokenPath;
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        Path memory path,
        address to,
        uint256 deadline
    ) external returns (uint256 amountOut);

    function swapExactTokensForNATIVE(
        uint256 amountIn,
        uint256 amountOutMinNATIVE,
        Path memory path,
        address payable to,
        uint256 deadline
    ) external returns (uint256 amountOut);

    function swapExactNATIVEForTokens(
        uint256 amountOutMin,
        Path memory path,
        address to,
        uint256 deadline
    ) external payable returns (uint256 amountOut);

    function getSwapOut(
        ILBPair pair,
        uint128 amountIn,
        bool swapForY
    ) external view returns (uint128 amountInLeft, uint128 amountOut, uint128 fee);
}

interface IMerchantMoeFactory {
    function getLBPairInformation(
        address tokenX,
        address tokenY,
        uint256 binStep
    ) external view returns (
        address lbPair,
        uint256 binStep_,
        uint256 createdByOwner,
        uint256 ignoredForRouting
    );

    function getAllLBPairs(
        address tokenX,
        address tokenY
    ) external view returns (address[] memory lbPairs);
}
