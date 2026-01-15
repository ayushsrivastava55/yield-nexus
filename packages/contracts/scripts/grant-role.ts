import { ethers } from "hardhat";

async function main() {
  const IDENTITY_REGISTRY_ADDRESS = "0x9Cc3F9D6Eb74b6b86B6F612941eDC8d25050147F";
  const REGISTRAR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REGISTRAR_ROLE"));
  
  // Get the wallet address to grant role to
  const [deployer] = await ethers.getSigners();
  const walletToGrant = ethers.getAddress(process.env.WALLET_TO_GRANT || deployer.address);
  
  console.log("Granting REGISTRAR_ROLE...");
  console.log("Registry:", IDENTITY_REGISTRY_ADDRESS);
  console.log("To wallet:", walletToGrant);
  
  const registry = await ethers.getContractAt("IdentityRegistry", IDENTITY_REGISTRY_ADDRESS);
  
  // Check if already has role
  const hasRole = await registry.hasRole(REGISTRAR_ROLE, walletToGrant);
  if (hasRole) {
    console.log("✅ Wallet already has REGISTRAR_ROLE");
    return;
  }
  
  // Grant role
  const tx = await registry.grantRole(REGISTRAR_ROLE, walletToGrant);
  console.log("Transaction sent:", tx.hash);
  
  await tx.wait();
  console.log("✅ REGISTRAR_ROLE granted successfully!");
  
  // Verify
  const hasRoleNow = await registry.hasRole(REGISTRAR_ROLE, walletToGrant);
  console.log("Verification:", hasRoleNow ? "✅ Role confirmed" : "❌ Role not found");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
