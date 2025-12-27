// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title YieldVault
 * @notice ERC-4626 compliant yield vault for RWA tokens on Mantle
 * @dev Manages deposits and withdrawals with yield accrual from strategies
 */
contract YieldVault is ERC4626, AccessControl, ReentrancyGuard {
    bytes32 public constant STRATEGIST_ROLE = keccak256("STRATEGIST_ROLE");
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");

    // Strategy router for yield generation
    address public strategyRouter;
    
    // Performance tracking
    uint256 public totalYieldGenerated;
    uint256 public lastHarvestTime;
    uint256 public harvestInterval = 1 hours;
    
    // Fee configuration (in basis points)
    uint256 public performanceFee = 200; // 2%
    uint256 public managementFee = 50;   // 0.5%
    address public feeRecipient;
    
    // Deposit/withdrawal limits
    uint256 public depositLimit;
    uint256 public minDeposit;
    
    // Strategy allocations (protocol ID => allocation in basis points)
    mapping(uint8 => uint256) public strategyAllocations;
    uint8[] public activeStrategies;
    
    // User tracking
    mapping(address => uint256) public userDepositTime;
    mapping(address => uint256) public userTotalDeposited;
    mapping(address => uint256) public userTotalWithdrawn;

    // Events
    event StrategyRouterUpdated(address indexed oldRouter, address indexed newRouter);
    event StrategyAllocationUpdated(uint8 indexed protocolId, uint256 allocation);
    event Harvested(uint256 yield, uint256 fee, uint256 timestamp);
    event FeesUpdated(uint256 performanceFee, uint256 managementFee);
    event DepositLimitUpdated(uint256 newLimit);

    constructor(
        IERC20 _asset,
        string memory _name,
        string memory _symbol,
        address _feeRecipient
    ) ERC4626(_asset) ERC20(_name, _symbol) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(STRATEGIST_ROLE, msg.sender);
        _grantRole(KEEPER_ROLE, msg.sender);
        
        feeRecipient = _feeRecipient;
        depositLimit = type(uint256).max;
        minDeposit = 0;
        lastHarvestTime = block.timestamp;
    }

    /**
     * @notice Set the strategy router address
     * @param _router New router address
     */
    function setStrategyRouter(address _router) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address oldRouter = strategyRouter;
        strategyRouter = _router;
        emit StrategyRouterUpdated(oldRouter, _router);
    }

    /**
     * @notice Update strategy allocation
     * @param protocolId Protocol identifier
     * @param allocation Allocation in basis points (10000 = 100%)
     */
    function setStrategyAllocation(uint8 protocolId, uint256 allocation) external onlyRole(STRATEGIST_ROLE) {
        require(allocation <= 10000, "Allocation exceeds 100%");
        
        // Check total allocation doesn't exceed 100%
        uint256 totalAllocation = allocation;
        for (uint256 i = 0; i < activeStrategies.length; i++) {
            if (activeStrategies[i] != protocolId) {
                totalAllocation += strategyAllocations[activeStrategies[i]];
            }
        }
        require(totalAllocation <= 10000, "Total allocation exceeds 100%");
        
        // Update allocation
        if (strategyAllocations[protocolId] == 0 && allocation > 0) {
            activeStrategies.push(protocolId);
        }
        strategyAllocations[protocolId] = allocation;
        
        emit StrategyAllocationUpdated(protocolId, allocation);
    }

    /**
     * @notice Update fee configuration
     * @param _performanceFee New performance fee in basis points
     * @param _managementFee New management fee in basis points
     */
    function setFees(uint256 _performanceFee, uint256 _managementFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_performanceFee <= 2000, "Performance fee too high"); // Max 20%
        require(_managementFee <= 500, "Management fee too high");    // Max 5%
        
        performanceFee = _performanceFee;
        managementFee = _managementFee;
        
        emit FeesUpdated(_performanceFee, _managementFee);
    }

    /**
     * @notice Set deposit limit
     * @param _limit New deposit limit
     */
    function setDepositLimit(uint256 _limit) external onlyRole(DEFAULT_ADMIN_ROLE) {
        depositLimit = _limit;
        emit DepositLimitUpdated(_limit);
    }

    /**
     * @notice Set minimum deposit
     * @param _minDeposit New minimum deposit
     */
    function setMinDeposit(uint256 _minDeposit) external onlyRole(DEFAULT_ADMIN_ROLE) {
        minDeposit = _minDeposit;
    }

    /**
     * @notice Harvest yield from strategies
     * @dev Called by keepers to collect and reinvest yield
     */
    function harvest() external nonReentrant onlyRole(KEEPER_ROLE) {
        require(block.timestamp >= lastHarvestTime + harvestInterval, "Too soon to harvest");
        
        // Calculate yield (simplified - in production would query actual strategy returns)
        uint256 currentAssets = totalAssets();
        uint256 expectedAssets = totalSupply(); // 1:1 at deposit
        
        if (currentAssets > expectedAssets) {
            uint256 yield = currentAssets - expectedAssets;
            
            // Calculate and transfer fees
            uint256 fee = (yield * performanceFee) / 10000;
            if (fee > 0) {
                // Transfer fee to recipient
                IERC20(asset()).transfer(feeRecipient, fee);
            }
            
            totalYieldGenerated += yield - fee;
            
            emit Harvested(yield, fee, block.timestamp);
        }
        
        lastHarvestTime = block.timestamp;
    }

    /**
     * @notice Override deposit to track user stats and enforce limits
     */
    function deposit(uint256 assets, address receiver) public virtual override nonReentrant returns (uint256) {
        require(assets >= minDeposit, "Below minimum deposit");
        require(totalAssets() + assets <= depositLimit, "Deposit limit exceeded");
        
        if (userDepositTime[receiver] == 0) {
            userDepositTime[receiver] = block.timestamp;
        }
        userTotalDeposited[receiver] += assets;
        
        return super.deposit(assets, receiver);
    }

    /**
     * @notice Override withdraw to track user stats
     */
    function withdraw(
        uint256 assets,
        address receiver,
        address owner
    ) public virtual override nonReentrant returns (uint256) {
        userTotalWithdrawn[owner] += assets;
        return super.withdraw(assets, receiver, owner);
    }

    /**
     * @notice Get vault statistics
     */
    function getVaultStats() external view returns (
        uint256 _totalAssets,
        uint256 _totalSupply,
        uint256 _totalYield,
        uint256 _lastHarvest,
        uint256 _depositLimit
    ) {
        return (
            totalAssets(),
            totalSupply(),
            totalYieldGenerated,
            lastHarvestTime,
            depositLimit
        );
    }

    /**
     * @notice Get user statistics
     */
    function getUserStats(address user) external view returns (
        uint256 shares,
        uint256 assets,
        uint256 deposited,
        uint256 withdrawn,
        uint256 depositTime
    ) {
        return (
            balanceOf(user),
            convertToAssets(balanceOf(user)),
            userTotalDeposited[user],
            userTotalWithdrawn[user],
            userDepositTime[user]
        );
    }

    /**
     * @notice Get active strategies
     */
    function getActiveStrategies() external view returns (uint8[] memory, uint256[] memory) {
        uint256[] memory allocations = new uint256[](activeStrategies.length);
        for (uint256 i = 0; i < activeStrategies.length; i++) {
            allocations[i] = strategyAllocations[activeStrategies[i]];
        }
        return (activeStrategies, allocations);
    }

    /**
     * @notice Calculate current APY (simplified)
     * @dev In production, would calculate based on actual yield over time
     */
    function getCurrentAPY() external view returns (uint256) {
        if (totalYieldGenerated == 0 || totalAssets() == 0) return 0;
        
        uint256 timeSinceStart = block.timestamp - lastHarvestTime;
        if (timeSinceStart == 0) return 0;
        
        // Annualized yield percentage (in basis points)
        uint256 yieldRate = (totalYieldGenerated * 10000) / totalAssets();
        uint256 annualizedRate = (yieldRate * 365 days) / timeSinceStart;
        
        return annualizedRate;
    }

    /**
     * @notice Emergency withdraw all funds
     */
    function emergencyWithdraw(address to) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 balance = IERC20(asset()).balanceOf(address(this));
        IERC20(asset()).transfer(to, balance);
    }
}
