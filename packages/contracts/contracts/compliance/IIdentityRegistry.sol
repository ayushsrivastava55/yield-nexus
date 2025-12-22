// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IIdentityRegistry
 * @dev Interface for the Identity Registry contract (ERC-3643 compliant)
 * Manages investor identities and their verification status
 */
interface IIdentityRegistry {
    // KYC tier levels
    enum KYCTier { NONE, RETAIL, ACCREDITED, INSTITUTIONAL }

    // Events
    event IdentityRegistered(address indexed investor, address indexed identity);
    event IdentityRemoved(address indexed investor);
    event IdentityUpdated(address indexed oldIdentity, address indexed newIdentity);
    event CountryUpdated(address indexed investor, uint16 indexed country);
    event ClaimTopicsRegistrySet(address indexed claimTopicsRegistry);
    event TrustedIssuersRegistrySet(address indexed trustedIssuersRegistry);

    /**
     * @dev Registers an identity for an investor
     * @param _investor The address of the investor
     * @param _identity The address of the identity contract
     * @param _country The country code of the investor
     */
    function registerIdentity(
        address _investor,
        address _identity,
        uint16 _country
    ) external;

    /**
     * @dev Removes an identity from the registry
     * @param _investor The address of the investor
     */
    function deleteIdentity(address _investor) external;

    /**
     * @dev Updates the country of an investor
     * @param _investor The address of the investor
     * @param _country The new country code
     */
    function updateCountry(address _investor, uint16 _country) external;

    /**
     * @dev Updates the identity contract of an investor
     * @param _investor The address of the investor
     * @param _identity The new identity contract address
     */
    function updateIdentity(address _investor, address _identity) external;

    /**
     * @dev Checks if an investor is verified
     * @param _investor The address of the investor
     * @return bool True if the investor is verified
     */
    function isVerified(address _investor) external view returns (bool);

    /**
     * @dev Gets the identity contract of an investor
     * @param _investor The address of the investor
     * @return address The identity contract address
     */
    function identity(address _investor) external view returns (address);

    /**
     * @dev Gets the country of an investor
     * @param _investor The address of the investor
     * @return uint16 The country code
     */
    function investorCountry(address _investor) external view returns (uint16);

    /**
     * @dev Checks if an address has an identity registered
     * @param _investor The address to check
     * @return bool True if identity exists
     */
    function contains(address _investor) external view returns (bool);

    /**
     * @dev Gets the KYC tier of an investor
     * @param _investor The address of the investor
     * @return KYCTier The KYC tier
     */
    function getKYCTier(address _investor) external view returns (KYCTier);
}
