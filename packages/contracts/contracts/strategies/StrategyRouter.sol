// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../integrations/IMerchantMoe.sol";

interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

/**
 * @title StrategyRouter
 * @notice Routes yield strategies across multiple Mantle protocols
 * @dev Integrates with Merchant Moe, INIT Capital, and other yield sources
 */
contract StrategyRouter is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant STRATEGIST_ROLE = keccak256("STRATEGIST_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    // Protocol identifiers
    uint8 public constant PROTOCOL_MERCHANT_MOE = 1;
    uint8 public constant PROTOCOL_INIT_CAPITAL = 2;
    uint8 public constant PROTOCOL_RENZO = 3;
    uint8 public constant PROTOCOL_METH = 4;

    // Protocol adapters
    mapping(uint8 => address) public protocolAdapters;
    
    // Approved tokens for routing
    mapping(address => bool) public approvedTokens;

    // Oracle price feeds (Chainlink AggregatorV3)
    mapping(address => address) public priceFeeds;
    uint256 public maxOracleStaleness = 1 hours;
    uint256 public maxPriceDeviationBps = 500; // 5%
    
    // Strategy configurations
    struct Strategy {
        uint8 protocolId;
        address inputToken;
        address outputToken;
        uint256 minAmount;
        uint256 maxSlippage; // in basis points (100 = 1%)
        bool active;
    }
    
    mapping(bytes32 => Strategy) public strategies;
    bytes32[] public strategyIds;

    struct StrategyPath {
        uint256[] pairBinSteps;
        ILBRouter.Version[] versions;
        address[] tokenPath;
    }

    mapping(bytes32 => StrategyPath) private strategyPaths;

    // Execution tracking
    struct Execution {
        bytes32 strategyId;
        uint256 amountIn;
        uint256 amountOut;
        uint256 timestamp;
        address executor;
    }
    
    Execution[] public executions;
    mapping(address => uint256[]) public userExecutions;

    // Events
    event ProtocolAdapterSet(uint8 indexed protocolId, address adapter);
    event TokenApproved(address indexed token, bool approved);
    event StrategyCreated(bytes32 indexed strategyId, uint8 protocolId, address inputToken, address outputToken);
    event StrategyUpdated(bytes32 indexed strategyId, bool active);
    event StrategyPathUpdated(bytes32 indexed strategyId);
    event PriceFeedUpdated(address indexed token, address indexed feed);
    event OracleConfigUpdated(uint256 maxStaleness, uint256 maxDeviationBps);
    event StrategyExecuted(
        bytes32 indexed strategyId,
        address indexed executor,
        uint256 amountIn,
        uint256 amountOut,
        uint256 timestamp
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(STRATEGIST_ROLE, msg.sender);
        _grantRole(EXECUTOR_ROLE, msg.sender);
    }

    function setPriceFeed(address token, address feed) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(token != address(0) && feed != address(0), "Invalid address");
        priceFeeds[token] = feed;
        emit PriceFeedUpdated(token, feed);
    }

    function setOracleConfig(uint256 maxStaleness, uint256 maxDeviationBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(maxDeviationBps <= 5000, "Deviation too high");
        maxOracleStaleness = maxStaleness;
        maxPriceDeviationBps = maxDeviationBps;
        emit OracleConfigUpdated(maxStaleness, maxDeviationBps);
    }

    /**
     * @notice Set protocol adapter address
     * @param protocolId Protocol identifier
     * @param adapter Adapter contract address
     */
    function setProtocolAdapter(uint8 protocolId, address adapter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(adapter != address(0), "Invalid adapter");
        protocolAdapters[protocolId] = adapter;
        emit ProtocolAdapterSet(protocolId, adapter);
    }

    /**
     * @notice Approve or revoke token for routing
     * @param token Token address
     * @param approved Approval status
     */
    function setTokenApproval(address token, bool approved) external onlyRole(DEFAULT_ADMIN_ROLE) {
        approvedTokens[token] = approved;
        emit TokenApproved(token, approved);
    }

    /**
     * @notice Create a new yield strategy
     * @param protocolId Target protocol
     * @param inputToken Token to deposit
     * @param outputToken Token to receive (can be same as input for lending)
     * @param minAmount Minimum amount for execution
     * @param maxSlippage Maximum slippage in basis points
     */
    function createStrategy(
        uint8 protocolId,
        address inputToken,
        address outputToken,
        uint256 minAmount,
        uint256 maxSlippage
    ) external onlyRole(STRATEGIST_ROLE) returns (bytes32 strategyId) {
        require(protocolAdapters[protocolId] != address(0), "Protocol not configured");
        require(approvedTokens[inputToken], "Input token not approved");
        require(maxSlippage <= 1000, "Slippage too high"); // Max 10%

        strategyId = keccak256(abi.encodePacked(protocolId, inputToken, outputToken, block.timestamp));
        
        strategies[strategyId] = Strategy({
            protocolId: protocolId,
            inputToken: inputToken,
            outputToken: outputToken,
            minAmount: minAmount,
            maxSlippage: maxSlippage,
            active: true
        });
        
        strategyIds.push(strategyId);
        
        emit StrategyCreated(strategyId, protocolId, inputToken, outputToken);
    }

    /**
     * @notice Update strategy status
     * @param strategyId Strategy identifier
     * @param active New status
     */
    function updateStrategy(bytes32 strategyId, bool active) external onlyRole(STRATEGIST_ROLE) {
        require(strategies[strategyId].protocolId != 0, "Strategy not found");
        strategies[strategyId].active = active;
        emit StrategyUpdated(strategyId, active);
    }

    /**
     * @notice Set path info for Merchant Moe swaps
     */
    function setStrategyPath(
        bytes32 strategyId,
        uint256[] calldata pairBinSteps,
        ILBRouter.Version[] calldata versions,
        address[] calldata tokenPath
    ) external onlyRole(STRATEGIST_ROLE) {
        require(strategies[strategyId].protocolId != 0, "Strategy not found");
        require(tokenPath.length >= 2, "Invalid path");
        require(pairBinSteps.length == tokenPath.length - 1, "Path length mismatch");
        require(versions.length == pairBinSteps.length, "Versions length mismatch");

        strategyPaths[strategyId] = StrategyPath({
            pairBinSteps: pairBinSteps,
            versions: versions,
            tokenPath: tokenPath
        });

        emit StrategyPathUpdated(strategyId);
    }

    function getStrategyPath(
        bytes32 strategyId
    ) external view returns (uint256[] memory, ILBRouter.Version[] memory, address[] memory) {
        StrategyPath storage pathInfo = strategyPaths[strategyId];
        return (pathInfo.pairBinSteps, pathInfo.versions, pathInfo.tokenPath);
    }

    /**
     * @notice Execute a yield strategy
     * @param strategyId Strategy to execute
     * @param amount Amount of input token
     * @param minAmountOut Minimum output amount (slippage protection)
     */
    function executeStrategy(
        bytes32 strategyId,
        uint256 amount,
        uint256 minAmountOut
    ) external nonReentrant onlyRole(EXECUTOR_ROLE) returns (uint256 amountOut) {
        Strategy storage strategy = strategies[strategyId];
        require(strategy.active, "Strategy not active");
        require(amount >= strategy.minAmount, "Amount below minimum");

        address adapter = protocolAdapters[strategy.protocolId];
        require(adapter != address(0), "Adapter not set");

        // Transfer input tokens from caller
        IERC20(strategy.inputToken).safeTransferFrom(msg.sender, address(this), amount);
        
        // Approve adapter to spend tokens
        IERC20(strategy.inputToken).safeIncreaseAllowance(adapter, amount);

        _checkOraclePricing(strategy.inputToken, strategy.outputToken, amount, minAmountOut);

        if (strategy.protocolId == PROTOCOL_MERCHANT_MOE) {
            amountOut = _executeMerchantMoe(strategyId, strategy, amount, minAmountOut);
        } else {
            // Execute via adapter (placeholder for other protocols)
            amountOut = _simulateExecution(strategy, amount);
        }
        
        require(amountOut >= minAmountOut, "Slippage exceeded");

        // Record execution
        executions.push(Execution({
            strategyId: strategyId,
            amountIn: amount,
            amountOut: amountOut,
            timestamp: block.timestamp,
            executor: msg.sender
        }));
        userExecutions[msg.sender].push(executions.length - 1);

        emit StrategyExecuted(strategyId, msg.sender, amount, amountOut, block.timestamp);
    }

    function _checkOraclePricing(
        address inputToken,
        address outputToken,
        uint256 amountIn,
        uint256 minAmountOut
    ) internal view {
        address feedIn = priceFeeds[inputToken];
        address feedOut = priceFeeds[outputToken];
        if (feedIn == address(0) || feedOut == address(0)) {
            return;
        }

        (uint256 priceIn, uint8 inDecimals) = _getOraclePrice(feedIn);
        (uint256 priceOut, uint8 outDecimals) = _getOraclePrice(feedOut);

        uint256 expectedOut = (amountIn * priceIn * (10 ** outDecimals)) / (priceOut * (10 ** inDecimals));
        uint256 minOracleOut = (expectedOut * (10000 - maxPriceDeviationBps)) / 10000;
        require(minAmountOut >= minOracleOut, "Min amount below oracle bounds");
    }

    function _getOraclePrice(address feed) internal view returns (uint256 price, uint8 decimals) {
        AggregatorV3Interface aggregator = AggregatorV3Interface(feed);
        decimals = aggregator.decimals();
        (uint80 roundId, int256 answer, , uint256 updatedAt, uint80 answeredInRound) = aggregator.latestRoundData();
        require(answer > 0, "Invalid oracle answer");
        require(answeredInRound >= roundId, "Stale oracle round");
        require(block.timestamp - updatedAt <= maxOracleStaleness, "Oracle data stale");
        price = uint256(answer);
    }

    function _executeMerchantMoe(
        bytes32 strategyId,
        Strategy storage strategy,
        uint256 amount,
        uint256 minAmountOut
    ) internal returns (uint256 amountOut) {
        StrategyPath storage pathInfo = strategyPaths[strategyId];
        require(pathInfo.tokenPath.length >= 2, "Path not set");

        ILBRouter router = ILBRouter(protocolAdapters[strategy.protocolId]);
        ILBRouter.Path memory path = ILBRouter.Path({
            pairBinSteps: pathInfo.pairBinSteps,
            versions: pathInfo.versions,
            tokenPath: pathInfo.tokenPath
        });

        amountOut = router.swapExactTokensForTokens(
            amount,
            minAmountOut,
            path,
            address(this),
            block.timestamp + 15 minutes
        );

        IERC20(strategy.outputToken).safeTransfer(msg.sender, amountOut);
    }

    /**
     * @notice Simulate strategy execution (placeholder for actual protocol calls)
     * @dev In production, this would call the actual protocol adapters
     */
    function _simulateExecution(Strategy storage strategy, uint256 amount) internal view returns (uint256) {
        // Simulate based on protocol type
        if (strategy.protocolId == PROTOCOL_MERCHANT_MOE) {
            // DEX swap - assume 0.3% fee
            return amount * 997 / 1000;
        } else if (strategy.protocolId == PROTOCOL_INIT_CAPITAL) {
            // Lending deposit - 1:1 for shares
            return amount;
        } else if (strategy.protocolId == PROTOCOL_RENZO) {
            // Liquid restaking - slight premium
            return amount * 1001 / 1000;
        } else if (strategy.protocolId == PROTOCOL_METH) {
            // mETH staking
            return amount;
        }
        return amount;
    }

    /**
     * @notice Get all strategy IDs
     */
    function getAllStrategies() external view returns (bytes32[] memory) {
        return strategyIds;
    }

    /**
     * @notice Get strategy details
     */
    function getStrategy(bytes32 strategyId) external view returns (
        uint8 protocolId,
        address inputToken,
        address outputToken,
        uint256 minAmount,
        uint256 maxSlippage,
        bool active
    ) {
        Strategy storage s = strategies[strategyId];
        return (s.protocolId, s.inputToken, s.outputToken, s.minAmount, s.maxSlippage, s.active);
    }

    /**
     * @notice Get execution count
     */
    function getExecutionCount() external view returns (uint256) {
        return executions.length;
    }

    /**
     * @notice Get user's execution history
     */
    function getUserExecutions(address user) external view returns (uint256[] memory) {
        return userExecutions[user];
    }

    /**
     * @notice Emergency withdraw tokens
     */
    function emergencyWithdraw(address token, address to, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        IERC20(token).safeTransfer(to, amount);
    }
}
