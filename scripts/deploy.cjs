const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying ConfidentialVoting contract...");

  // Get the contract factory
  const ConfidentialVoting = await ethers.getContractFactory("ConfidentialVoting");
  
  // Deploy the contract with a verifier address (you can use any address for testing)
  const verifierAddress = "0x0000000000000000000000000000000000000000"; // Replace with actual verifier address
  
  const confidentialVoting = await ConfidentialVoting.deploy(verifierAddress);
  
  await confidentialVoting.waitForDeployment();
  
  const contractAddress = await confidentialVoting.getAddress();
  
  console.log("ConfidentialVoting deployed to:", contractAddress);
  
  // Create some initial projects for testing
  console.log("Creating initial projects...");
  
  const tx1 = await confidentialVoting.createProject(
    "DecentraliZOOM",
    "Decentralized video conferencing with end-to-end encryption and token rewards",
    "Web3 Wizards",
    "Communication"
  );
  await tx1.wait();
  
  const tx2 = await confidentialVoting.createProject(
    "CryptoCollab",
    "DAO-powered collaborative workspace for remote teams",
    "BlockBuilders", 
    "Productivity"
  );
  await tx2.wait();
  
  const tx3 = await confidentialVoting.createProject(
    "NFTunes",
    "Music NFT marketplace with artist royalty distribution",
    "SoundChain",
    "Entertainment"
  );
  await tx3.wait();
  
  console.log("Initial projects created successfully!");
  
  // Create a voting session
  console.log("Creating voting session...");
  
  const sessionTx = await confidentialVoting.createVotingSession(
    "Hackathon Voting Session",
    "Vote for your favorite projects in this hackathon",
    7 * 24 * 60 * 60, // 7 days duration
    [0, 1, 2] // Project IDs
  );
  await sessionTx.wait();
  
  console.log("Voting session created successfully!");
  
  console.log("\n=== Deployment Summary ===");
  console.log("Contract Address:", contractAddress);
  console.log("Network: Sepolia Testnet");
  console.log("Verifier Address:", verifierAddress);
  console.log("Projects Created: 3");
  console.log("Voting Sessions Created: 1");
  
  console.log("\n=== Next Steps ===");
  console.log("1. Update VITE_VOTING_CONTRACT_ADDRESS in .env file with:", contractAddress);
  console.log("2. Start the frontend with: npm run dev");
  console.log("3. Connect your wallet and start voting!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });