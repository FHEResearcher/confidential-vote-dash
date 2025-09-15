const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying ConfidentialVoting contract...");

  // Get the contract factory
  const ConfidentialVoting = await ethers.getContractFactory("ConfidentialVoting");
  
  // Deploy the contract
  // Note: You'll need to provide a verifier address
  const verifierAddress = "0x0000000000000000000000000000000000000000"; // Replace with actual verifier address
  
  const confidentialVoting = await ConfidentialVoting.deploy(verifierAddress);
  
  await confidentialVoting.waitForDeployment();
  
  const contractAddress = await confidentialVoting.getAddress();
  
  console.log("ConfidentialVoting deployed to:", contractAddress);
  console.log("Contract address:", contractAddress);
  
  // Save the contract address to a file for easy reference
  const fs = require('fs');
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: "sepolia",
    timestamp: new Date().toISOString(),
    verifierAddress: verifierAddress
  };
  
  fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to deployment-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
