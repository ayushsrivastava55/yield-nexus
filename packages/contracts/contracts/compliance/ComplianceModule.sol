// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IIdentityRegistry.sol";

/**
 * @title ComplianceModule
 * @dev ERC-3643 compliant module for enforcing transfer restrictions
 * Checks jurisdiction rules, investor limits, and other compliance requirements
 */
contract ComplianceModule is AccessControl {
    bytes32 public constant COMPLIANCE_AGENT_ROLE = keccak256("COMPLIANCE_AGENT_ROLE");

    IIdentityRegistry public identityRegistry;

    // Restricted countries (country code => restricted)
    mapping(uint16 => bool) public restrictedCountries;
    
    // Maximum holders allowed (0 = unlimited)
    uint256 public maxHolders;
    uint256 public currentHolders;
    
    // Minimum/maximum investment amounts per tier
    mapping(IIdentityRegistry.KYCTier => uint256) public minInvestment;
    mapping(IIdentityRegistry.KYCTier => uint256) public maxInvestment;
    
    // Investor holdings tracking
    mapping(address => uint256) public investorHoldings;
    
    // Transfer cooldown (anti-wash trading)
    uint256 public transferCooldown;
    mapping(address => uint256) public lastTransferTime;

    // Events
    event CountryRestricted(uint16 indexed country, bool restricted);
    event MaxHoldersUpdated(uint256 maxHolders);
    event InvestmentLimitsUpdated(IIdentityRegistry.KYCTier tier, uint256 min, uint256 max);
    event TransferCooldownUpdated(uint256 cooldown);

    constructor(address _identityRegistry) {
        require(_identityRegistry != address(0), "Invalid registry address");
        identityRegistry = IIdentityRegistry(_identityRegistry);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(COMPLIANCE_AGENT_ROLE, msg.sender);

        // Set default investment limits
        minInvestment[IIdentityRegistry.KYCTier.RETAIL] = 100 * 1e18; // $100
        maxInvestment[IIdentityRegistry.KYCTier.RETAIL] = 10000 * 1e18; // $10,000
        
        minInvestment[IIdentityRegistry.KYCTier.ACCREDITED] = 1000 * 1e18; // $1,000
        maxInvestment[IIdentityRegistry.KYCTier.ACCREDITED] = 1000000 * 1e18; // $1M
        
        minInvestment[IIdentityRegistry.KYCTier.INSTITUTIONAL] = 100000 * 1e18; // $100,000
        maxInvestment[IIdentityRegistry.KYCTier.INSTITUTIONAL] = type(uint256).max; // Unlimited
    }

    /**
     * @dev Checks if a transfer is compliant
     * @param _from Sender address
     * @param _to Recipient address
     * @param _amount Transfer amount
     * @return bool True if transfer is compliant
     */
    function canTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) external view returns (bool) {
        // Skip checks for minting (from zero address)
        if (_from == address(0)) {
            return _checkRecipientCompliance(_to, _amount);
        }
        
        // Skip checks for burning (to zero address)
        if (_to == address(0)) {
            return true;
        }

        // Check sender compliance
        if (!identityRegistry.isVerified(_from)) {
            return false;
        }

        // Check recipient compliance
        if (!_checkRecipientCompliance(_to, _amount)) {
            return false;
        }

        // Check transfer cooldown
        if (transferCooldown > 0 && block.timestamp < lastTransferTime[_from] + transferCooldown) {
            return false;
        }

        return true;
    }

    /**
     * @dev Internal function to check recipient compliance
     */
    function _checkRecipientCompliance(
        address _to,
        uint256 _amount
    ) internal view returns (bool) {
        // Check if recipient is verified
        if (!identityRegistry.isVerified(_to)) {
            return false;
        }

        // Check country restrictions
        uint16 country = identityRegistry.investorCountry(_to);
        if (restrictedCountries[country]) {
            return false;
        }

        // Check max holders limit
        if (maxHolders > 0 && investorHoldings[_to] == 0 && currentHolders >= maxHolders) {
            return false;
        }

        // Check investment limits based on KYC tier
        IIdentityRegistry.KYCTier tier = IIdentityRegistry(identityRegistry).getKYCTier(_to);
        uint256 newBalance = investorHoldings[_to] + _amount;
        
        if (newBalance < minInvestment[tier] || newBalance > maxInvestment[tier]) {
            return false;
        }

        return true;
    }

    /**
     * @dev Called after a compliant transfer to update state
     */
    function transferred(
        address _from,
        address _to,
        uint256 _amount
    ) external onlyRole(COMPLIANCE_AGENT_ROLE) {
        // Update holder count
        if (_from != address(0) && investorHoldings[_from] == _amount) {
            currentHolders--;
        }
        if (_to != address(0) && investorHoldings[_to] == 0) {
            currentHolders++;
        }

        // Update holdings
        if (_from != address(0)) {
            investorHoldings[_from] -= _amount;
            lastTransferTime[_from] = block.timestamp;
        }
        if (_to != address(0)) {
            investorHoldings[_to] += _amount;
        }
    }

    /**
     * @dev Restrict or unrestrict a country
     */
    function setCountryRestriction(
        uint16 _country,
        bool _restricted
    ) external onlyRole(COMPLIANCE_AGENT_ROLE) {
        restrictedCountries[_country] = _restricted;
        emit CountryRestricted(_country, _restricted);
    }

    /**
     * @dev Batch restrict countries
     */
    function batchSetCountryRestrictions(
        uint16[] calldata _countries,
        bool _restricted
    ) external onlyRole(COMPLIANCE_AGENT_ROLE) {
        for (uint256 i = 0; i < _countries.length; i++) {
            restrictedCountries[_countries[i]] = _restricted;
            emit CountryRestricted(_countries[i], _restricted);
        }
    }

    /**
     * @dev Set maximum number of holders
     */
    function setMaxHolders(uint256 _maxHolders) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxHolders = _maxHolders;
        emit MaxHoldersUpdated(_maxHolders);
    }

    /**
     * @dev Set investment limits for a tier
     */
    function setInvestmentLimits(
        IIdentityRegistry.KYCTier _tier,
        uint256 _min,
        uint256 _max
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_min <= _max, "Min must be <= max");
        minInvestment[_tier] = _min;
        maxInvestment[_tier] = _max;
        emit InvestmentLimitsUpdated(_tier, _min, _max);
    }

    /**
     * @dev Set transfer cooldown period
     */
    function setTransferCooldown(uint256 _cooldown) external onlyRole(DEFAULT_ADMIN_ROLE) {
        transferCooldown = _cooldown;
        emit TransferCooldownUpdated(_cooldown);
    }

    /**
     * @dev Update identity registry address
     */
    function setIdentityRegistry(address _identityRegistry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_identityRegistry != address(0), "Invalid registry address");
        identityRegistry = IIdentityRegistry(_identityRegistry);
    }
}
