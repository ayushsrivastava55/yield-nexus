// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../compliance/IIdentityRegistry.sol";
import "../compliance/ComplianceModule.sol";

/**
 * @title RWAToken
 * @dev ERC-3643 compliant Real World Asset token
 * Implements permissioned transfers with compliance checks
 */
contract RWAToken is ERC20, ERC20Burnable, ERC20Pausable, ERC20Permit, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant FREEZER_ROLE = keccak256("FREEZER_ROLE");
    bytes32 public constant RECOVERY_ROLE = keccak256("RECOVERY_ROLE");

    IIdentityRegistry public identityRegistry;
    ComplianceModule public complianceModule;

    // Asset metadata
    string public assetType; // e.g., "BOND", "REAL_ESTATE", "INVOICE"
    string public assetDescription;
    string public legalDocumentURI;
    
    // Frozen addresses
    mapping(address => bool) public frozen;
    
    // Total supply cap (0 = unlimited)
    uint256 public supplyCap;

    // Events
    event AddressFrozen(address indexed account, bool frozen);
    event TokensRecovered(address indexed from, address indexed to, uint256 amount);
    event ComplianceModuleUpdated(address indexed newModule);
    event IdentityRegistryUpdated(address indexed newRegistry);
    event AssetMetadataUpdated(string assetType, string description, string legalDocURI);

    constructor(
        string memory _name,
        string memory _symbol,
        address _identityRegistry,
        address _complianceModule,
        string memory _assetType,
        string memory _assetDescription,
        uint256 _supplyCap
    ) ERC20(_name, _symbol) ERC20Permit(_name) {
        require(_identityRegistry != address(0), "Invalid identity registry");
        require(_complianceModule != address(0), "Invalid compliance module");

        identityRegistry = IIdentityRegistry(_identityRegistry);
        complianceModule = ComplianceModule(_complianceModule);
        assetType = _assetType;
        assetDescription = _assetDescription;
        supplyCap = _supplyCap;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(FREEZER_ROLE, msg.sender);
        _grantRole(RECOVERY_ROLE, msg.sender);
    }

    /**
     * @dev Mint new tokens (only to verified addresses)
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(!frozen[to], "Recipient is frozen");
        require(
            supplyCap == 0 || totalSupply() + amount <= supplyCap,
            "Supply cap exceeded"
        );
        require(
            complianceModule.canTransfer(address(0), to, amount),
            "Compliance check failed"
        );

        _mint(to, amount);
        complianceModule.transferred(address(0), to, amount);
    }

    /**
     * @dev Batch mint to multiple addresses
     */
    function batchMint(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyRole(MINTER_ROLE) {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        require(
            supplyCap == 0 || totalSupply() + totalAmount <= supplyCap,
            "Supply cap exceeded"
        );

        for (uint256 i = 0; i < recipients.length; i++) {
            require(!frozen[recipients[i]], "Recipient is frozen");
            require(
                complianceModule.canTransfer(address(0), recipients[i], amounts[i]),
                "Compliance check failed"
            );
            
            _mint(recipients[i], amounts[i]);
            complianceModule.transferred(address(0), recipients[i], amounts[i]);
        }
    }

    /**
     * @dev Freeze an address (prevent all transfers)
     */
    function setFrozen(address account, bool _frozen) external onlyRole(FREEZER_ROLE) {
        frozen[account] = _frozen;
        emit AddressFrozen(account, _frozen);
    }

    /**
     * @dev Batch freeze addresses
     */
    function batchSetFrozen(
        address[] calldata accounts,
        bool _frozen
    ) external onlyRole(FREEZER_ROLE) {
        for (uint256 i = 0; i < accounts.length; i++) {
            frozen[accounts[i]] = _frozen;
            emit AddressFrozen(accounts[i], _frozen);
        }
    }

    /**
     * @dev Recover tokens from a frozen/lost wallet (compliance requirement)
     */
    function recoverTokens(
        address from,
        address to,
        uint256 amount
    ) external onlyRole(RECOVERY_ROLE) {
        require(frozen[from], "Source not frozen");
        require(identityRegistry.isVerified(to), "Recipient not verified");
        require(!frozen[to], "Recipient is frozen");

        _transfer(from, to, amount);
        complianceModule.transferred(from, to, amount);
        
        emit TokensRecovered(from, to, amount);
    }

    /**
     * @dev Pause all transfers
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause transfers
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Update compliance module
     */
    function setComplianceModule(address _complianceModule) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_complianceModule != address(0), "Invalid address");
        complianceModule = ComplianceModule(_complianceModule);
        emit ComplianceModuleUpdated(_complianceModule);
    }

    /**
     * @dev Update identity registry
     */
    function setIdentityRegistry(address _identityRegistry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_identityRegistry != address(0), "Invalid address");
        identityRegistry = IIdentityRegistry(_identityRegistry);
        emit IdentityRegistryUpdated(_identityRegistry);
    }

    /**
     * @dev Update asset metadata
     */
    function setAssetMetadata(
        string calldata _assetType,
        string calldata _description,
        string calldata _legalDocURI
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        assetType = _assetType;
        assetDescription = _description;
        legalDocumentURI = _legalDocURI;
        emit AssetMetadataUpdated(_assetType, _description, _legalDocURI);
    }

    /**
     * @dev Override transfer to include compliance checks
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Pausable) {
        // Skip compliance for mint/burn from admin
        if (from != address(0) && to != address(0)) {
            require(!frozen[from], "Sender is frozen");
            require(!frozen[to], "Recipient is frozen");
            require(
                complianceModule.canTransfer(from, to, value),
                "Compliance check failed"
            );
        }

        super._update(from, to, value);

        // Update compliance module state after successful transfer
        if (from != address(0) && to != address(0)) {
            complianceModule.transferred(from, to, value);
        }
    }

    /**
     * @dev Check if transfer would be compliant (view function for UI)
     */
    function canTransfer(
        address from,
        address to,
        uint256 amount
    ) external view returns (bool, string memory) {
        if (paused()) return (false, "Token is paused");
        if (frozen[from]) return (false, "Sender is frozen");
        if (frozen[to]) return (false, "Recipient is frozen");
        if (!complianceModule.canTransfer(from, to, amount)) {
            return (false, "Compliance check failed");
        }
        return (true, "");
    }
}
