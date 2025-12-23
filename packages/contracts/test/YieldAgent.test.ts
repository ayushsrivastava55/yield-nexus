import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("YieldAgent", function () {
  let yieldAgent: any;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const YieldAgent = await ethers.getContractFactory("YieldAgent");
    yieldAgent = await YieldAgent.deploy();
    await yieldAgent.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should grant admin role to deployer", async function () {
      const DEFAULT_ADMIN_ROLE = await yieldAgent.DEFAULT_ADMIN_ROLE();
      expect(await yieldAgent.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.equal(true);
    });

    it("Should grant operator role to deployer", async function () {
      const OPERATOR_ROLE = await yieldAgent.OPERATOR_ROLE();
      expect(await yieldAgent.hasRole(OPERATOR_ROLE, owner.address)).to.equal(true);
    });
  });

  describe("Agent Management", function () {
    it("Should create a new agent", async function () {
      const tx = await yieldAgent.createAgent(
        "Conservative Yield Agent",
        3600, // 1 hour min rebalance interval
        100 // 1% max slippage
      );
      await tx.wait();
      
      const agent = await yieldAgent.agents(0);
      expect(agent.name).to.equal("Conservative Yield Agent");
      expect(agent.active).to.equal(true);
      expect(agent.owner).to.equal(owner.address);
    });

    it("Should increment agent ID", async function () {
      await yieldAgent.createAgent("Agent 1", 3600, 100);
      await yieldAgent.createAgent("Agent 2", 3600, 100);
      
      expect(await yieldAgent.nextAgentId()).to.equal(2);
    });
  });

  describe("Chainlink Automation", function () {
    it("Should have rebalance interval set", async function () {
      expect(await yieldAgent.rebalanceInterval()).to.equal(3600); // 1 hour default
    });

    it("Should track last rebalance time", async function () {
      // Create an agent first
      await yieldAgent.createAgent("Test Agent", 3600, 100);
      
      // Last rebalance time should be 0 initially
      expect(await yieldAgent.lastRebalanceTime()).to.equal(0);
    });
  });

  describe("Access Control", function () {
    it("Should allow anyone to create agents", async function () {
      // Users can create their own agents
      await expect(
        yieldAgent.connect(user).createAgent("User Agent", 3600, 100)
      ).to.not.be.reverted;
      
      const agent = await yieldAgent.agents(0);
      expect(agent.owner).to.equal(user.address);
    });
  });
});
