const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ConfidentialVoting", function () {
  let confidentialVoting;
  let owner;
  let voter1;
  let voter2;
  let verifier;

  beforeEach(async function () {
    [owner, voter1, voter2, verifier] = await ethers.getSigners();
    
    const ConfidentialVoting = await ethers.getContractFactory("ConfidentialVoting");
    confidentialVoting = await ConfidentialVoting.deploy(verifier.address);
    await confidentialVoting.waitForDeployment();
  });

  describe("Project Creation", function () {
    it("Should create a new project", async function () {
      const tx = await confidentialVoting.createProject(
        "Test Project",
        "A test project description",
        "Test Team",
        "Technology"
      );
      
      await expect(tx)
        .to.emit(confidentialVoting, "ProjectCreated")
        .withArgs(0, owner.address, "Test Project");
      
      const projectCount = await confidentialVoting.getProjectCount();
      expect(projectCount).to.equal(1);
    });

    it("Should not create project with empty name", async function () {
      await expect(
        confidentialVoting.createProject(
          "",
          "A test project description",
          "Test Team",
          "Technology"
        )
      ).to.be.revertedWith("Project name cannot be empty");
    });
  });

  describe("Voting Session Creation", function () {
    beforeEach(async function () {
      // Create a project first
      await confidentialVoting.createProject(
        "Test Project",
        "A test project description",
        "Test Team",
        "Technology"
      );
    });

    it("Should create a new voting session", async function () {
      const projectIds = [0];
      const duration = 7 * 24 * 60 * 60; // 7 days
      
      const tx = await confidentialVoting.createVotingSession(
        "Test Session",
        "A test voting session",
        duration,
        projectIds
      );
      
      await expect(tx)
        .to.emit(confidentialVoting, "VotingSessionCreated")
        .withArgs(0, owner.address, "Test Session");
      
      const sessionCount = await confidentialVoting.getSessionCount();
      expect(sessionCount).to.equal(1);
    });

    it("Should not create session with empty title", async function () {
      await expect(
        confidentialVoting.createVotingSession(
          "",
          "A test voting session",
          7 * 24 * 60 * 60,
          [0]
        )
      ).to.be.revertedWith("Session title cannot be empty");
    });
  });

  describe("Voting", function () {
    let sessionId;
    let projectId;

    beforeEach(async function () {
      // Create a project
      await confidentialVoting.createProject(
        "Test Project",
        "A test project description",
        "Test Team",
        "Technology"
      );
      projectId = 0;

      // Create a voting session
      const projectIds = [projectId];
      const duration = 7 * 24 * 60 * 60; // 7 days
      
      await confidentialVoting.createVotingSession(
        "Test Session",
        "A test voting session",
        duration,
        projectIds
      );
      sessionId = 0;
    });

    it("Should allow voting with encrypted score", async function () {
      // Mock encrypted score data
      const encryptedScore = ethers.utils.formatBytes32String("encrypted_score_data");
      const proof = ethers.utils.formatBytes32String("proof_data");
      
      const tx = await confidentialVoting.connect(voter1).castVote(
        projectId,
        sessionId,
        encryptedScore,
        proof
      );
      
      await expect(tx)
        .to.emit(confidentialVoting, "VoteCast")
        .withArgs(0, projectId, voter1.address);
      
      const voteCount = await confidentialVoting.getVoteCount();
      expect(voteCount).to.equal(1);
    });

    it("Should not allow voting twice in the same session", async function () {
      const encryptedScore = ethers.utils.formatBytes32String("encrypted_score_data");
      const proof = ethers.utils.formatBytes32String("proof_data");
      
      // First vote
      await confidentialVoting.connect(voter1).castVote(
        projectId,
        sessionId,
        encryptedScore,
        proof
      );
      
      // Second vote should fail
      await expect(
        confidentialVoting.connect(voter1).castVote(
          projectId,
          sessionId,
          encryptedScore,
          proof
        )
      ).to.be.revertedWith("Already voted in this session");
    });

    it("Should not allow voting for non-existent project", async function () {
      const encryptedScore = ethers.utils.formatBytes32String("encrypted_score_data");
      const proof = ethers.utils.formatBytes32String("proof_data");
      
      await expect(
        confidentialVoting.connect(voter1).castVote(
          999, // Non-existent project
          sessionId,
          encryptedScore,
          proof
        )
      ).to.be.revertedWith("Project does not exist");
    });
  });

  describe("Results Reveal", function () {
    let sessionId;

    beforeEach(async function () {
      // Create a project and session
      await confidentialVoting.createProject(
        "Test Project",
        "A test project description",
        "Test Team",
        "Technology"
      );
      
      await confidentialVoting.createVotingSession(
        "Test Session",
        "A test voting session",
        7 * 24 * 60 * 60,
        [0]
      );
      sessionId = 0;
    });

    it("Should allow organizer to reveal results", async function () {
      // Fast forward time to after session ends
      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]); // 8 days
      await ethers.provider.send("evm_mine");
      
      const tx = await confidentialVoting.revealResults(sessionId);
      
      await expect(tx)
        .to.emit(confidentialVoting, "ResultsRevealed")
        .withArgs(sessionId);
    });

    it("Should not allow non-organizer to reveal results", async function () {
      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      
      await expect(
        confidentialVoting.connect(voter1).revealResults(sessionId)
      ).to.be.revertedWith("Only organizer can reveal results");
    });
  });

  describe("Access Control", function () {
    it("Should allow only verifier to update reputation", async function () {
      // This test would require FHE operations to be properly implemented
      // For now, we'll just test the access control
      const mockReputation = ethers.utils.formatBytes32String("encrypted_reputation");
      
      await expect(
        confidentialVoting.connect(verifier).updateVoterReputation(
          voter1.address,
          mockReputation
        )
      ).to.not.be.reverted;
      
      await expect(
        confidentialVoting.connect(voter1).updateVoterReputation(
          voter1.address,
          mockReputation
        )
      ).to.be.revertedWith("Only verifier can call this function");
    });
  });
});
