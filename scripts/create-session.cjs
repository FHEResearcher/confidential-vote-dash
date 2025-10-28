const { ethers } = require("hardhat");

async function main() {
  console.log("Creating voting session for deployed contract...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  
  // Get the deployed contract
  const contractAddress = "0x2c6216Ac4d65d7d2720Cc45c11Da554CdB06Dcba";
  const ConfidentialVoting = await ethers.getContractFactory("ConfidentialVoting");
  const contract = ConfidentialVoting.attach(contractAddress);
  
  console.log("Connected to contract:", contractAddress);
  
  try {
    // Create voting session
    console.log("Creating voting session...");
    const sessionTx = await contract.createVotingSession(
      "Hackathon Voting Session",
      "Vote for your favorite projects in this hackathon",
      7 * 24 * 60 * 60, // 7 days duration
      [0, 1, 2] // Project IDs
    );
    await sessionTx.wait();
    
    console.log("✅ Voting session created successfully!");
    console.log("Session includes projects: 0, 1, 2");
    console.log("Duration: 7 days");
    
  } catch (error) {
    console.error("Failed to create voting session:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
