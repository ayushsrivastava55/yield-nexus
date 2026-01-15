// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

interface IStrategyRouter {
    function executeStrategy(bytes32 strategyId, uint256 amount, uint256 minAmountOut) external returns (uint256 amountOut);
    function strategies(bytes32 strategyId) external view returns (
        uint8 protocolId,
        address inputToken,
        address outputToken,
        uint256 minAmount,
        uint256 maxSlippage,
        bool active
    );
    function getAllStrategies() external view returns (bytes32[] memory);
}

/**
 * @title YieldAgent
 * @dev Autonomous yield optimization agent with Chainlink Automation
 * Executes yield strategies across Mantle DeFi protocols
 */
contract YieldAgent is AccessControl, Pausable, ReentrancyGuard, AutomationCompatibleInterface {
    using SafeERC20 for IERC20;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant STRATEGIST_ROLE = keccak256("STRATEGIST_ROLE");

    // Agent configuration
    struct AgentConfig {
        address owner;
        string name;
        uint256 minRebalanceInterval; // Minimum time between rebalances
        uint256 maxSlippage; // Max slippage in basis points (100 = 1%)
        uint256 gasLimit; // Max gas for operations
        bool active;
    }

    // Strategy definition
    struct Strategy {
        address protocol;
        address inputToken;
        address outputToken;
        uint256 targetAllocation; // In basis points (10000 = 100%)
        uint256 currentAllocation;
        bool active;
        bytes32 routerStrategyId; // Strategy ID in StrategyRouter for real execution
    }

    // Agent state
    mapping(uint256 => AgentConfig) public agents;
    mapping(uint256 => Strategy[]) public agentStrategies;
    mapping(uint256 => mapping(address => uint256)) public agentBalances;
    
    uint256 public nextAgentId;
    uint256 public lastRebalanceTime;
    uint256 public rebalanceInterval = 1 hours;

    // Protocol adapters (simplified interface)
    mapping(address => bool) public approvedProtocols;

    // Performance tracking
    mapping(uint256 => uint256) public agentTVL;
    mapping(uint256 => uint256) public agentProfits;
    mapping(uint256 => uint256) public agentGasSpent;

    // Strategy router for real protocol execution
    IStrategyRouter public strategyRouter;

    // Events
    event AgentCreated(uint256 indexed agentId, address indexed owner, string name);
    event AgentUpdated(uint256 indexed agentId);
    event AgentDeactivated(uint256 indexed agentId);
    event StrategyAdded(uint256 indexed agentId, uint256 strategyIndex, address protocol);
    event StrategyRemoved(uint256 indexed agentId, uint256 strategyIndex);
    event Rebalanced(uint256 indexed agentId, uint256 timestamp, uint256 gasUsed);
    event Deposited(uint256 indexed agentId, address indexed token, uint256 amount);
    event Withdrawn(uint256 indexed agentId, address indexed token, uint256 amount, address to);
    event ProtocolApproved(address indexed protocol, bool approved);
    event StrategyRouterUpdated(address indexed router);
    event StrategyExecuted(uint256 indexed agentId, bytes32 indexed strategyId, uint256 amountIn, uint256 amountOut);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(STRATEGIST_ROLE, msg.sender);
    }

    function setStrategyRouter(address _router) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_router != address(0), "Invalid router");
        strategyRouter = IStrategyRouter(_router);
        emit StrategyRouterUpdated(_router);
    }

    /**
     * @dev Create a new yield agent
     */
    function createAgent(
        string calldata _name,
        uint256 _minRebalanceInterval,
        uint256 _maxSlippage
    ) external returns (uint256 agentId) {
        agentId = nextAgentId++;
        
        agents[agentId] = AgentConfig({
            owner: msg.sender,
            name: _name,
            minRebalanceInterval: _minRebalanceInterval,
            maxSlippage: _maxSlippage,
            gasLimit: 500000,
            active: true
        });

        emit AgentCreated(agentId, msg.sender, _name);
    }

    /**
     * @dev Add a strategy to an agent
     * @param _routerStrategyId The strategy ID from StrategyRouter for real execution (pass bytes32(0) if not using router)
     */
    function addStrategy(
        uint256 _agentId,
        address _protocol,
        address _inputToken,
        address _outputToken,
        uint256 _targetAllocation,
        bytes32 _routerStrategyId
    ) external {
        require(agents[_agentId].owner == msg.sender, "Not agent owner");
        require(approvedProtocols[_protocol], "Protocol not approved");
        require(_targetAllocation <= 10000, "Allocation > 100%");

        // Check total allocation doesn't exceed 100%
        uint256 totalAllocation = _targetAllocation;
        Strategy[] storage strategies = agentStrategies[_agentId];
        for (uint256 i = 0; i < strategies.length; i++) {
            if (strategies[i].active) {
                totalAllocation += strategies[i].targetAllocation;
            }
        }
        require(totalAllocation <= 10000, "Total allocation > 100%");

        strategies.push(Strategy({
            protocol: _protocol,
            inputToken: _inputToken,
            outputToken: _outputToken,
            targetAllocation: _targetAllocation,
            currentAllocation: 0,
            active: true,
            routerStrategyId: _routerStrategyId
        }));

        emit StrategyAdded(_agentId, strategies.length - 1, _protocol);
    }

    /**
     * @dev Add a strategy to an agent (legacy function without router strategy ID)
     */
    function addStrategy(
        uint256 _agentId,
        address _protocol,
        address _inputToken,
        address _outputToken,
        uint256 _targetAllocation
    ) external {
        require(agents[_agentId].owner == msg.sender, "Not agent owner");
        require(approvedProtocols[_protocol], "Protocol not approved");
        require(_targetAllocation <= 10000, "Allocation > 100%");

        // Check total allocation doesn't exceed 100%
        uint256 totalAllocation = _targetAllocation;
        Strategy[] storage strategies = agentStrategies[_agentId];
        for (uint256 i = 0; i < strategies.length; i++) {
            if (strategies[i].active) {
                totalAllocation += strategies[i].targetAllocation;
            }
        }
        require(totalAllocation <= 10000, "Total allocation > 100%");

        strategies.push(Strategy({
            protocol: _protocol,
            inputToken: _inputToken,
            outputToken: _outputToken,
            targetAllocation: _targetAllocation,
            currentAllocation: 0,
            active: true,
            routerStrategyId: bytes32(0)
        }));

        emit StrategyAdded(_agentId, strategies.length - 1, _protocol);
    }

    /**
     * @dev Remove a strategy from an agent
     */
    function removeStrategy(uint256 _agentId, uint256 _strategyIndex) external {
        require(agents[_agentId].owner == msg.sender, "Not agent owner");
        require(_strategyIndex < agentStrategies[_agentId].length, "Invalid index");

        agentStrategies[_agentId][_strategyIndex].active = false;
        emit StrategyRemoved(_agentId, _strategyIndex);
    }

    /**
     * @dev Deposit tokens into an agent
     */
    function deposit(
        uint256 _agentId,
        address _token,
        uint256 _amount
    ) external nonReentrant {
        require(agents[_agentId].active, "Agent not active");
        
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        agentBalances[_agentId][_token] += _amount;
        agentTVL[_agentId] += _amount; // Simplified TVL tracking

        emit Deposited(_agentId, _token, _amount);
    }

    /**
     * @dev Withdraw tokens from an agent
     */
    function withdraw(
        uint256 _agentId,
        address _token,
        uint256 _amount
    ) external nonReentrant {
        require(agents[_agentId].owner == msg.sender, "Not agent owner");
        require(agentBalances[_agentId][_token] >= _amount, "Insufficient balance");

        agentBalances[_agentId][_token] -= _amount;
        agentTVL[_agentId] -= _amount;
        
        IERC20(_token).safeTransfer(msg.sender, _amount);
        emit Withdrawn(_agentId, _token, _amount, msg.sender);
    }

    /**
     * @dev Execute a real strategy via StrategyRouter (owner only)
     */
    function executeStrategyForAgent(
        uint256 _agentId,
        bytes32 _strategyId,
        uint256 _amount,
        uint256 _minAmountOut
    ) external nonReentrant returns (uint256 amountOut) {
        require(address(strategyRouter) != address(0), "Router not set");
        require(agents[_agentId].owner == msg.sender, "Not agent owner");
        require(agents[_agentId].active, "Agent not active");

        (
            ,
            address inputToken,
            address outputToken,
            uint256 minAmount,
            ,
            bool active
        ) = strategyRouter.strategies(_strategyId);
        require(active, "Strategy not active");
        require(_amount >= minAmount, "Amount below minimum");
        require(agentBalances[_agentId][inputToken] >= _amount, "Insufficient balance");

        agentBalances[_agentId][inputToken] -= _amount;
        IERC20(inputToken).safeIncreaseAllowance(address(strategyRouter), _amount);

        amountOut = strategyRouter.executeStrategy(_strategyId, _amount, _minAmountOut);

        agentBalances[_agentId][outputToken] += amountOut;
        if (amountOut > _amount) {
            agentProfits[_agentId] += (amountOut - _amount);
        }

        emit StrategyExecuted(_agentId, _strategyId, _amount, amountOut);
    }

    /**
     * @dev Chainlink Automation: Check if rebalance is needed
     */
    function checkUpkeep(
        bytes calldata checkData
    ) external view override returns (bool upkeepNeeded, bytes memory performData) {
        uint256 agentId = abi.decode(checkData, (uint256));
        
        AgentConfig storage agent = agents[agentId];
        if (!agent.active) {
            return (false, "");
        }

        // Check if enough time has passed
        if (block.timestamp < lastRebalanceTime + agent.minRebalanceInterval) {
            return (false, "");
        }

        // Check if rebalance is needed based on allocation drift
        Strategy[] storage strategies = agentStrategies[agentId];
        for (uint256 i = 0; i < strategies.length; i++) {
            if (strategies[i].active) {
                uint256 drift = _calculateDrift(
                    strategies[i].currentAllocation,
                    strategies[i].targetAllocation
                );
                // Rebalance if drift > 5%
                if (drift > 500) {
                    return (true, abi.encode(agentId));
                }
            }
        }

        return (false, "");
    }

    /**
     * @dev Chainlink Automation: Perform rebalance
     */
    function performUpkeep(bytes calldata performData) external override nonReentrant {
        uint256 startGas = gasleft();
        uint256 agentId = abi.decode(performData, (uint256));
        
        AgentConfig storage agent = agents[agentId];
        require(agent.active, "Agent not active");
        require(
            block.timestamp >= lastRebalanceTime + agent.minRebalanceInterval,
            "Too soon to rebalance"
        );

        // Execute rebalance logic (simplified)
        _executeRebalance(agentId);

        lastRebalanceTime = block.timestamp;
        uint256 gasUsed = startGas - gasleft();
        agentGasSpent[agentId] += gasUsed;

        emit Rebalanced(agentId, block.timestamp, gasUsed);
    }

    /**
     * @dev Manual rebalance trigger (for testing/emergency)
     */
    function manualRebalance(uint256 _agentId) external onlyRole(OPERATOR_ROLE) {
        _executeRebalance(_agentId);
        emit Rebalanced(_agentId, block.timestamp, 0);
    }

    /**
     * @dev Internal rebalance execution - executes real trades via StrategyRouter
     */
    function _executeRebalance(uint256 _agentId) internal {
        require(address(strategyRouter) != address(0), "Strategy router not set");

        AgentConfig storage agent = agents[_agentId];
        Strategy[] storage strategies = agentStrategies[_agentId];

        // Calculate total value in agent (simplified: sum of all token balances)
        uint256 totalValue = _calculateTotalValue(_agentId, strategies);
        if (totalValue == 0) {
            // No funds to rebalance, just update allocations
            for (uint256 i = 0; i < strategies.length; i++) {
                if (strategies[i].active) {
                    strategies[i].currentAllocation = strategies[i].targetAllocation;
                }
            }
            return;
        }

        // Execute rebalancing for each strategy that has drift
        for (uint256 i = 0; i < strategies.length; i++) {
            Strategy storage strategy = strategies[i];
            if (!strategy.active) continue;

            // Calculate current value for this strategy's output token
            uint256 currentValue = agentBalances[_agentId][strategy.outputToken];
            uint256 currentAllocationBps = (currentValue * 10000) / totalValue;

            // Calculate drift
            uint256 drift = _calculateDrift(currentAllocationBps, strategy.targetAllocation);

            // Only rebalance if drift > 5% (500 bps)
            if (drift > 500 && strategy.routerStrategyId != bytes32(0)) {
                _executeStrategyRebalance(_agentId, strategy, totalValue, currentValue, agent.maxSlippage);
            }

            // Update current allocation
            strategy.currentAllocation = (agentBalances[_agentId][strategy.outputToken] * 10000) / totalValue;
        }
    }

    /**
     * @dev Calculate total value across all tokens in an agent
     */
    function _calculateTotalValue(uint256 _agentId, Strategy[] storage strategies) internal view returns (uint256 totalValue) {
        // Add input token balances
        for (uint256 i = 0; i < strategies.length; i++) {
            if (strategies[i].active) {
                totalValue += agentBalances[_agentId][strategies[i].inputToken];
                totalValue += agentBalances[_agentId][strategies[i].outputToken];
            }
        }
    }

    /**
     * @dev Execute strategy rebalance via StrategyRouter
     */
    function _executeStrategyRebalance(
        uint256 _agentId,
        Strategy storage strategy,
        uint256 totalValue,
        uint256 currentValue,
        uint256 maxSlippage
    ) internal {
        uint256 targetValue = (totalValue * strategy.targetAllocation) / 10000;

        if (currentValue < targetValue) {
            // Need to buy more of output token
            uint256 amountToBuy = targetValue - currentValue;
            uint256 inputBalance = agentBalances[_agentId][strategy.inputToken];

            if (inputBalance > 0 && amountToBuy > 0) {
                uint256 amountToSwap = amountToBuy > inputBalance ? inputBalance : amountToBuy;
                uint256 minAmountOut = (amountToSwap * (10000 - maxSlippage)) / 10000;

                // Update balances before external call
                agentBalances[_agentId][strategy.inputToken] -= amountToSwap;

                // Approve and execute via router
                IERC20(strategy.inputToken).safeIncreaseAllowance(address(strategyRouter), amountToSwap);

                try strategyRouter.executeStrategy(strategy.routerStrategyId, amountToSwap, minAmountOut) returns (uint256 amountOut) {
                    agentBalances[_agentId][strategy.outputToken] += amountOut;
                    if (amountOut > amountToSwap) {
                        agentProfits[_agentId] += (amountOut - amountToSwap);
                    }
                    emit StrategyExecuted(_agentId, strategy.routerStrategyId, amountToSwap, amountOut);
                } catch {
                    // Revert balance change on failure
                    agentBalances[_agentId][strategy.inputToken] += amountToSwap;
                }
            }
        }
        // Note: Selling (currentValue > targetValue) would require reverse strategy
    }

    /**
     * @dev Calculate allocation drift in basis points
     */
    function _calculateDrift(
        uint256 current,
        uint256 target
    ) internal pure returns (uint256) {
        if (target == 0) return current;
        if (current > target) {
            return ((current - target) * 10000) / target;
        }
        return ((target - current) * 10000) / target;
    }

    /**
     * @dev Approve a protocol for strategies
     */
    function setProtocolApproval(
        address _protocol,
        bool _approved
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        approvedProtocols[_protocol] = _approved;
        emit ProtocolApproved(_protocol, _approved);
    }

    /**
     * @dev Update agent configuration
     */
    function updateAgent(
        uint256 _agentId,
        uint256 _minRebalanceInterval,
        uint256 _maxSlippage,
        uint256 _gasLimit
    ) external {
        require(agents[_agentId].owner == msg.sender, "Not agent owner");
        
        agents[_agentId].minRebalanceInterval = _minRebalanceInterval;
        agents[_agentId].maxSlippage = _maxSlippage;
        agents[_agentId].gasLimit = _gasLimit;

        emit AgentUpdated(_agentId);
    }

    /**
     * @dev Deactivate an agent
     */
    function deactivateAgent(uint256 _agentId) external {
        require(agents[_agentId].owner == msg.sender, "Not agent owner");
        agents[_agentId].active = false;
        emit AgentDeactivated(_agentId);
    }

    /**
     * @dev Get agent strategies
     */
    function getAgentStrategies(uint256 _agentId) external view returns (Strategy[] memory) {
        return agentStrategies[_agentId];
    }

    /**
     * @dev Get agent performance metrics
     */
    function getAgentMetrics(uint256 _agentId) external view returns (
        uint256 tvl,
        uint256 profits,
        uint256 gasSpent,
        uint256 strategyCount
    ) {
        return (
            agentTVL[_agentId],
            agentProfits[_agentId],
            agentGasSpent[_agentId],
            agentStrategies[_agentId].length
        );
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Emergency withdraw (admin only)
     */
    function emergencyWithdraw(
        address _token,
        uint256 _amount,
        address _to
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        IERC20(_token).safeTransfer(_to, _amount);
    }
}
