import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RWAToken", function () {
  let rwaToken: any;
  let identityRegistry: any;
  let complianceModule: any;
  let owner: SignerWithAddress;
  let issuer: SignerWithAddress;
  let investor1: SignerWithAddress;
  let investor2: SignerWithAddress;

  beforeEach(async function () {
    [owner, issuer, investor1, investor2] = await ethers.getSigners();

    // Deploy Identity Registry
    const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    identityRegistry = await IdentityRegistry.deploy();
    await identityRegistry.waitForDeployment();

    // Deploy Compliance Module
    const ComplianceModule = await ethers.getContractFactory("ComplianceModule");
    complianceModule = await ComplianceModule.deploy(await identityRegistry.getAddress());
    await complianceModule.waitForDeployment();

    // Deploy RWA Token
    const RWAToken = await ethers.getContractFactory("RWAToken");
    rwaToken = await RWAToken.deploy(
      "Real World Asset Token",
      "RWA",
      await identityRegistry.getAddress(),
      await complianceModule.getAddress(),
      "BOND",
      "Corporate Bond Token",
      ethers.parseEther("1000000") // 1M supply cap
    );
    await rwaToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await rwaToken.name()).to.equal("Real World Asset Token");
      expect(await rwaToken.symbol()).to.equal("RWA");
    });

    it("Should set the correct decimals", async function () {
      expect(await rwaToken.decimals()).to.equal(18);
    });

    it("Should set the deployer as admin", async function () {
      const DEFAULT_ADMIN_ROLE = await rwaToken.DEFAULT_ADMIN_ROLE();
      expect(await rwaToken.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.equal(true);
    });
  });

  describe("Identity Registration", function () {
    it("Should register an identity", async function () {
      // registerIdentity(investor, identity, country)
      await identityRegistry.registerIdentity(investor1.address, investor1.address, 840);
      expect(await identityRegistry.isVerified(investor1.address)).to.equal(true);
    });

    it("Should get country for identity", async function () {
      await identityRegistry.registerIdentity(investor1.address, investor1.address, 840);
      expect(await identityRegistry.investorCountry(investor1.address)).to.equal(840);
    });
  });

  describe("Token Minting", function () {
    beforeEach(async function () {
      // Register investor identity with Accredited tier
      await identityRegistry.registerIdentityWithTier(
        investor1.address,
        investor1.address,
        840, // USA
        2 // KYCTier.ACCREDITED
      );
    });

    it("Should mint tokens to verified investor", async function () {
      await rwaToken.mint(investor1.address, ethers.parseEther("1000"));
      expect(await rwaToken.balanceOf(investor1.address)).to.equal(ethers.parseEther("1000"));
    });

    it("Should fail to mint to unverified address", async function () {
      await expect(
        rwaToken.mint(investor2.address, ethers.parseEther("1000"))
      ).to.be.revertedWith("Recipient not verified");
    });
  });

  describe("Token Transfers", function () {
    beforeEach(async function () {
      // Register both investors
      await identityRegistry.registerIdentityWithTier(investor1.address, investor1.address, 840, 2);
      await identityRegistry.registerIdentityWithTier(investor2.address, investor2.address, 840, 2);
      
      // Mint tokens to investor1
      await rwaToken.mint(investor1.address, ethers.parseEther("1000"));
    });

    it("Should transfer between verified investors", async function () {
      await rwaToken.connect(investor1).transfer(investor2.address, ethers.parseEther("100"));
      expect(await rwaToken.balanceOf(investor2.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should fail transfer to unverified address", async function () {
      // Remove investor2 verification
      await identityRegistry.deleteIdentity(investor2.address);
      
      await expect(
        rwaToken.connect(investor1).transfer(investor2.address, ethers.parseEther("100"))
      ).to.be.revertedWith("Recipient not verified");
    });
  });

  describe("Pause Functionality", function () {
    beforeEach(async function () {
      await identityRegistry.registerIdentityWithTier(investor1.address, investor1.address, 840, 2);
      await rwaToken.mint(investor1.address, ethers.parseEther("1000"));
    });

    it("Should pause and unpause token", async function () {
      await rwaToken.pause();
      expect(await rwaToken.paused()).to.equal(true);
      
      await rwaToken.unpause();
      expect(await rwaToken.paused()).to.equal(false);
    });

    it("Should block transfers when paused", async function () {
      await identityRegistry.registerIdentityWithTier(investor2.address, investor2.address, 840, 2);
      
      await rwaToken.pause();
      
      await expect(
        rwaToken.connect(investor1).transfer(investor2.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(rwaToken, "EnforcedPause");
    });
  });
});
