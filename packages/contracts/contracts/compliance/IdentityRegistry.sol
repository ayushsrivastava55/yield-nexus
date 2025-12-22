// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./IIdentityRegistry.sol";

/**
 * @title IdentityRegistry
 * @dev ERC-3643 compliant Identity Registry for managing investor identities
 * Stores and manages the link between investor addresses and their identity contracts
 */
contract IdentityRegistry is IIdentityRegistry, AccessControl, Pausable {
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");

    // Mapping from investor address to identity contract address
    mapping(address => address) private _identities;
    
    // Mapping from investor address to country code
    mapping(address => uint16) private _countries;
    
    // Mapping to track if an investor is registered
    mapping(address => bool) private _registered;

    // KYC tiers (uses enum from IIdentityRegistry)
    mapping(address => KYCTier) private _kycTiers;

    // Events for KYC tier changes
    event KYCTierUpdated(address indexed investor, KYCTier tier);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRAR_ROLE, msg.sender);
        _grantRole(AGENT_ROLE, msg.sender);
    }

    /**
     * @dev Registers an identity for an investor
     */
    function registerIdentity(
        address _investor,
        address _identity,
        uint16 _country
    ) external override onlyRole(REGISTRAR_ROLE) whenNotPaused {
        require(_investor != address(0), "Invalid investor address");
        require(_identity != address(0), "Invalid identity address");
        require(!_registered[_investor], "Identity already registered");

        _identities[_investor] = _identity;
        _countries[_investor] = _country;
        _registered[_investor] = true;
        _kycTiers[_investor] = KYCTier.RETAIL; // Default tier

        emit IdentityRegistered(_investor, _identity);
        emit CountryUpdated(_investor, _country);
    }

    /**
     * @dev Registers identity with specific KYC tier
     */
    function registerIdentityWithTier(
        address _investor,
        address _identity,
        uint16 _country,
        KYCTier _tier
    ) external onlyRole(REGISTRAR_ROLE) whenNotPaused {
        require(_investor != address(0), "Invalid investor address");
        require(_identity != address(0), "Invalid identity address");
        require(!_registered[_investor], "Identity already registered");

        _identities[_investor] = _identity;
        _countries[_investor] = _country;
        _registered[_investor] = true;
        _kycTiers[_investor] = _tier;

        emit IdentityRegistered(_investor, _identity);
        emit CountryUpdated(_investor, _country);
        emit KYCTierUpdated(_investor, _tier);
    }

    /**
     * @dev Removes an identity from the registry
     */
    function deleteIdentity(address _investor) external override onlyRole(REGISTRAR_ROLE) {
        require(_registered[_investor], "Identity not registered");

        delete _identities[_investor];
        delete _countries[_investor];
        delete _registered[_investor];
        delete _kycTiers[_investor];

        emit IdentityRemoved(_investor);
    }

    /**
     * @dev Updates the country of an investor
     */
    function updateCountry(
        address _investor,
        uint16 _country
    ) external override onlyRole(AGENT_ROLE) {
        require(_registered[_investor], "Identity not registered");
        _countries[_investor] = _country;
        emit CountryUpdated(_investor, _country);
    }

    /**
     * @dev Updates the identity contract of an investor
     */
    function updateIdentity(
        address _investor,
        address _identity
    ) external override onlyRole(AGENT_ROLE) {
        require(_registered[_investor], "Identity not registered");
        require(_identity != address(0), "Invalid identity address");
        
        address oldIdentity = _identities[_investor];
        _identities[_investor] = _identity;
        
        emit IdentityUpdated(oldIdentity, _identity);
    }

    /**
     * @dev Updates the KYC tier of an investor
     */
    function updateKYCTier(
        address _investor,
        KYCTier _tier
    ) external onlyRole(AGENT_ROLE) {
        require(_registered[_investor], "Identity not registered");
        _kycTiers[_investor] = _tier;
        emit KYCTierUpdated(_investor, _tier);
    }

    /**
     * @dev Checks if an investor is verified (has identity registered)
     */
    function isVerified(address _investor) external view override returns (bool) {
        return _registered[_investor] && _kycTiers[_investor] != KYCTier.NONE;
    }

    /**
     * @dev Gets the identity contract of an investor
     */
    function identity(address _investor) external view override returns (address) {
        return _identities[_investor];
    }

    /**
     * @dev Gets the country of an investor
     */
    function investorCountry(address _investor) external view override returns (uint16) {
        return _countries[_investor];
    }

    /**
     * @dev Checks if an address has an identity registered
     */
    function contains(address _investor) external view override returns (bool) {
        return _registered[_investor];
    }

    /**
     * @dev Gets the KYC tier of an investor
     */
    function getKYCTier(address _investor) external view returns (KYCTier) {
        return _kycTiers[_investor];
    }

    /**
     * @dev Batch register identities
     */
    function batchRegisterIdentity(
        address[] calldata _investors,
        address[] calldata _identitiesArray,
        uint16[] calldata _countriesArray
    ) external onlyRole(REGISTRAR_ROLE) whenNotPaused {
        require(
            _investors.length == _identitiesArray.length &&
            _investors.length == _countriesArray.length,
            "Arrays length mismatch"
        );

        for (uint256 i = 0; i < _investors.length; i++) {
            if (!_registered[_investors[i]] && _investors[i] != address(0)) {
                _identities[_investors[i]] = _identitiesArray[i];
                _countries[_investors[i]] = _countriesArray[i];
                _registered[_investors[i]] = true;
                _kycTiers[_investors[i]] = KYCTier.RETAIL;

                emit IdentityRegistered(_investors[i], _identitiesArray[i]);
                emit CountryUpdated(_investors[i], _countriesArray[i]);
            }
        }
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
