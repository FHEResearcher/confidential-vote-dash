const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying ConfidentialVoting contract...");

  // Get the contract factory
  const ConfidentialVoting = await ethers.getContractFactory("ConfidentialVoting");
  
  // Deploy the contract with a verifier address (you can use a zero address for now)
  const verifierAddress = "0x0000000000000000000000000000000000000000";
  const confidentialVoting = await ConfidentialVoting.deploy(verifierAddress);

  // Wait for deployment to complete
  await confidentialVoting.waitForDeployment();

  const contractAddress = await confidentialVoting.getAddress();
  
  console.log("ConfidentialVoting deployed to:", contractAddress);
  console.log("Verifier address:", verifierAddress);
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    verifierAddress: verifierAddress,
    network: network.name,
    deployer: (await ethers.getSigners())[0].address,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };

  // Write deployment info to file
  const fs = require('fs');
  const path = require('path');
  const deploymentPath = path.join(__dirname, '..', 'deployment-info.json');
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to:", deploymentPath);
  
  // Verify contract on Etherscan (if on a supported network)
  if (network.name === "sepolia" || network.name === "mainnet") {
    console.log("Waiting for block confirmations before verification...");
    await confidentialVoting.deploymentTransaction().wait(6);
    
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [verifierAddress],
      });
      console.log("Contract verified on Etherscan");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });