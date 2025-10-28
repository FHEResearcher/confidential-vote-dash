const hre = require("hardhat");

async function main() {
  console.log("Initializing Confidential Vote Dash with meaningful data...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Using account:", deployer.address);
  
  // Get the deployed contract
  const contractAddress = "0x0Cc44332D13e849201e9b2C91827F89bE44136C6";
  const ConfidentialVoting = await hre.ethers.getContractFactory("ConfidentialVoting");
  const contract = ConfidentialVoting.attach(contractAddress);
  
  console.log("Connected to contract:", contractAddress);
  
  // Initialize FHEVM for CLI operations
  const { fhevm } = hre;
  await fhevm.initializeCLIApi();
  console.log("FHEVM initialized for CLI operations");
  
  // Create meaningful hackathon projects
  const projects = [
    {
      name: "DeFi Yield Optimizer",
      description: "An AI-powered DeFi protocol that automatically optimizes yield farming strategies across multiple chains while maintaining privacy through FHE encryption.",
      team: "CryptoOptimizers"
    },
    {
      name: "Privacy-Preserving DAO Governance",
      description: "A decentralized governance platform that enables confidential voting and decision-making for DAOs using fully homomorphic encryption.",
      team: "PrivacyDAO"
    },
    {
      name: "Secure Medical Data Exchange",
      description: "A blockchain-based platform for secure sharing of medical records between healthcare providers while maintaining patient privacy through FHE.",
      team: "MedChain"
    }
  ];
  
  console.log("\n=== Creating Hackathon Projects ===");
  
  // Create projects
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    console.log(`Creating project ${i + 1}: ${project.name}`);
    
    const tx = await contract.createProject(project.name, project.description);
    await tx.wait();
    console.log(`✅ Project ${i + 1} created successfully`);
  }
  
  // Create voting session
  console.log("\n=== Creating Voting Session ===");
  const sessionTx = await contract.createVotingSession(1, 7 * 24 * 60 * 60); // 7 days
  await sessionTx.wait();
  console.log("✅ Voting session created (7 days duration)");
  
  // Get project details
  console.log("\n=== Project Details ===");
  for (let i = 1; i <= projects.length; i++) {
    const project = await contract.getProject(i);
    console.log(`Project ${i}:`);
    console.log(`  Name: ${project.name}`);
    console.log(`  Description: ${project.description}`);
    console.log(`  Total Votes: ${project.totalVotes}`);
    console.log(`  Total Score: ${project.totalScore}`);
    console.log(`  Created: ${new Date(Number(project.createdAt) * 1000).toLocaleString()}`);
    console.log("");
  }
  
  // Get session details
  console.log("=== Voting Session Details ===");
  const session = await contract.getVotingSession(1);
  console.log(`Session ID: 1`);
  console.log(`Project ID: ${session.projectId}`);
  console.log(`Organizer: ${session.organizer}`);
  console.log(`Start Time: ${new Date(Number(session.startTime) * 1000).toLocaleString()}`);
  console.log(`End Time: ${new Date(Number(session.endTime) * 1000).toLocaleString()}`);
  console.log(`Status: ${session.isActive ? 'Active' : 'Inactive'}`);
  
  console.log("\n=== Initialization Complete ===");
  console.log("🎉 Hackathon projects and voting session created successfully!");
  console.log("\nNext steps:");
  console.log("1. Start the frontend: npm run dev");
  console.log("2. Connect your wallet to Sepolia testnet");
  console.log("3. Begin confidential voting!");
  
  console.log("\n=== Contract Information ===");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Network: Sepolia Testnet`);
  console.log(`Projects Created: ${projects.length}`);
  console.log(`Voting Sessions: 1`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Initialization failed:", error);
    process.exit(1);
  });
