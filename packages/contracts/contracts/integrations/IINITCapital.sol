// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IINITCapital
 * @notice Interface for INIT Capital Money Market on Mantle
 * @dev Liquidity Hook interface for lending/borrowing
 */
interface IInitCore {
    /// @notice Deposit tokens into a lending pool
    function mintTo(address pool, address to, uint256 amount) external returns (uint256 shares);
    
    /// @notice Withdraw tokens from a lending pool
    function burnTo(address pool, address to, uint256 shares) external returns (uint256 amount);
    
    /// @notice Borrow tokens from a lending pool
    function borrow(address pool, uint256 amount, uint256 posId, address to) external returns (uint256 borrowShares);
    
    /// @notice Repay borrowed tokens
    function repay(address pool, uint256 shares, uint256 posId) external returns (uint256 amount);
    
    /// @notice Get position info
    function getPositionInfo(uint256 posId) external view returns (
        address owner,
        address mode,
        uint256 health,
        uint256 collCredit,
        uint256 borrowCredit
    );
}

interface ILendingPool {
    /// @notice Get current supply APY
    function getSupplyRate() external view returns (uint256);
    
    /// @notice Get current borrow APY
    function getBorrowRate() external view returns (uint256);
    
    /// @notice Get total supply
    function totalSupply() external view returns (uint256);
    
    /// @notice Get total borrows
    function totalBorrows() external view returns (uint256);
    
    /// @notice Get utilization rate
    function utilizationRate() external view returns (uint256);
    
    /// @notice Get underlying token
    function underlyingToken() external view returns (address);
    
    /// @notice Convert shares to underlying amount
    function toAmt(uint256 shares) external view returns (uint256);
    
    /// @notice Convert underlying amount to shares
    function toShares(uint256 amount) external view returns (uint256);
}

interface IPositionManager {
    /// @notice Create a new position
    function createPosition(address mode, address viewer) external returns (uint256 posId);
    
    /// @notice Get position collaterals
    function getCollaterals(uint256 posId) external view returns (address[] memory pools, uint256[] memory amounts);
    
    /// @notice Get position borrows
    function getBorrows(uint256 posId) external view returns (address[] memory pools, uint256[] memory amounts);
}
