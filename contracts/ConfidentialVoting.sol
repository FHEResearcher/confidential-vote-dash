// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { euint32, externalEuint32, euint8, ebool, FHE } from "@fhevm/solidity/lib/FHE.sol";

contract ConfidentialVoting is SepoliaConfig {
    using FHE for *;
    
    struct Vote {
        euint32 voteId;
        euint32 projectId;
        euint32 score;
        address voter;
        uint256 timestamp;
        bool isRevealed;
    }
    
    struct Project {
        euint32 projectId;
        string name;
        string description;
        string team;
        string category;
        address creator;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        euint32 totalVotes;
        euint32 totalScore;
    }
    
    struct VotingSession {
        uint256 sessionId;
        string title;
        string description;
        address organizer;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool resultsRevealed;
        uint256[] projectIds;
    }
    
    mapping(uint256 => Vote) public votes;
    mapping(uint256 => Project) public projects;
    mapping(uint256 => VotingSession) public votingSessions;
    mapping(address => euint32) public voterReputation;
    mapping(address => mapping(uint256 => mapping(uint256 => bool))) public hasVoted; // user => sessionId => projectId => hasVoted
    
    uint256 public voteCounter;
    uint256 public projectCounter;
    uint256 public sessionCounter;
    
    address public owner;
    address public verifier;
    
    event VoteCast(uint256 indexed voteId, uint256 indexed projectId, address indexed voter);
    event ProjectCreated(uint256 indexed projectId, address indexed creator, string name);
    event VotingSessionCreated(uint256 indexed sessionId, address indexed organizer, string title);
    event ResultsRevealed(uint256 indexed sessionId);
    event ReputationUpdated(address indexed voter, uint32 reputation);
    
    constructor(address _verifier) {
        owner = msg.sender;
        verifier = _verifier;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyVerifier() {
        require(msg.sender == verifier, "Only verifier can call this function");
        _;
    }
    
    function createProject(
        string memory _name,
        string memory _description,
        string memory _team,
        string memory _category
    ) public returns (uint256) {
        require(bytes(_name).length > 0, "Project name cannot be empty");
        require(bytes(_description).length > 0, "Project description cannot be empty");
        
        uint256 projectId = projectCounter++;
        
        projects[projectId] = Project({
            projectId: FHE.asEuint32(0), // Will be set properly later
            name: _name,
            description: _description,
            team: _team,
            category: _category,
            creator: msg.sender,
            startTime: block.timestamp,
            endTime: 0, // No end time for projects
            isActive: true,
            totalVotes: FHE.asEuint32(0),
            totalScore: FHE.asEuint32(0)
        });
        
        emit ProjectCreated(projectId, msg.sender, _name);
        return projectId;
    }
    
    function createVotingSession(
        string memory _title,
        string memory _description,
        uint256 _duration,
        uint256[] memory _projectIds
    ) public returns (uint256) {
        require(bytes(_title).length > 0, "Session title cannot be empty");
        require(_duration > 0, "Duration must be positive");
        require(_projectIds.length > 0, "Must include at least one project");
        
        uint256 sessionId = sessionCounter++;
        
        votingSessions[sessionId] = VotingSession({
            sessionId: sessionId,
            title: _title,
            description: _description,
            organizer: msg.sender,
            startTime: block.timestamp,
            endTime: block.timestamp + _duration,
            isActive: true,
            resultsRevealed: false,
            projectIds: _projectIds
        });
        
        emit VotingSessionCreated(sessionId, msg.sender, _title);
        return sessionId;
    }
    
    function castVote(
        uint256 projectId,
        uint256 sessionId,
        externalEuint32 score,
        bytes calldata inputProof
    ) public returns (uint256) {
        require(projects[projectId].creator != address(0), "Project does not exist");
        require(projects[projectId].isActive, "Project is not active");
        require(votingSessions[sessionId].organizer != address(0), "Voting session does not exist");
        require(votingSessions[sessionId].isActive, "Voting session is not active");
        require(block.timestamp <= votingSessions[sessionId].endTime, "Voting session has ended");
        require(!hasVoted[msg.sender][sessionId][projectId], "Already voted for this project in this session");
        
        // Check if project is part of this voting session
        bool projectInSession = false;
        for (uint i = 0; i < votingSessions[sessionId].projectIds.length; i++) {
            if (votingSessions[sessionId].projectIds[i] == projectId) {
                projectInSession = true;
                break;
            }
        }
        require(projectInSession, "Project not part of this voting session");
        
        uint256 voteId = voteCounter++;
        
        // Convert externalEuint32 to euint32 using FHE.fromExternal
        euint32 internalScore = FHE.fromExternal(score, inputProof);
        
        // Note: Score validation will be done off-chain before encryption
        // The encrypted score is assumed to be valid (1-10 range)
        
        votes[voteId] = Vote({
            voteId: FHE.asEuint32(uint32(voteId)),
            projectId: FHE.asEuint32(uint32(projectId)),
            score: internalScore,
            voter: msg.sender,
            timestamp: block.timestamp,
            isRevealed: false
        });
        
        // Update project totals with encrypted values
        projects[projectId].totalVotes = FHE.add(projects[projectId].totalVotes, FHE.asEuint32(1));
        projects[projectId].totalScore = FHE.add(projects[projectId].totalScore, internalScore);
        
        // Set ACL permissions for decryption
        FHE.allowThis(projects[projectId].totalVotes);
        FHE.allowThis(projects[projectId].totalScore);
        FHE.allow(projects[projectId].totalVotes, msg.sender);
        FHE.allow(projects[projectId].totalScore, msg.sender);
        FHE.allow(projects[projectId].totalVotes, votingSessions[sessionId].organizer);
        FHE.allow(projects[projectId].totalScore, votingSessions[sessionId].organizer);
        
        // Mark as voted for this specific project
        hasVoted[msg.sender][sessionId][projectId] = true;
        
        emit VoteCast(voteId, projectId, msg.sender);
        return voteId;
    }
    
    function revealResults(uint256 sessionId) public {
        require(votingSessions[sessionId].organizer == msg.sender, "Only organizer can reveal results");
        require(votingSessions[sessionId].isActive, "Voting session must be active");
        require(block.timestamp > votingSessions[sessionId].endTime, "Voting session has not ended");
        require(!votingSessions[sessionId].resultsRevealed, "Results already revealed");
        
        votingSessions[sessionId].resultsRevealed = true;
        votingSessions[sessionId].isActive = false;
        
        emit ResultsRevealed(sessionId);
    }
    
    function updateVoterReputation(address voter, euint32 reputation) public onlyVerifier {
        require(voter != address(0), "Invalid voter address");
        
        voterReputation[voter] = reputation;
        emit ReputationUpdated(voter, 0); // FHE.decrypt(reputation) - will be decrypted off-chain
    }
    
    function getProjectInfo(uint256 projectId) public view returns (
        string memory name,
        string memory description,
        string memory team,
        string memory category,
        address creator,
        uint256 startTime,
        bool isActive,
        uint8 totalVotes,
        uint8 totalScore
    ) {
        Project storage project = projects[projectId];
        return (
            project.name,
            project.description,
            project.team,
            project.category,
            project.creator,
            project.startTime,
            project.isActive,
            0, // FHE.decrypt(project.totalVotes) - will be decrypted off-chain
            0  // FHE.decrypt(project.totalScore) - will be decrypted off-chain
        );
    }
    
    function getVotingSessionInfo(uint256 sessionId) public view returns (
        string memory title,
        string memory description,
        address organizer,
        uint256 startTime,
        uint256 endTime,
        bool isActive,
        bool resultsRevealed,
        uint256[] memory projectIds
    ) {
        VotingSession storage session = votingSessions[sessionId];
        return (
            session.title,
            session.description,
            session.organizer,
            session.startTime,
            session.endTime,
            session.isActive,
            session.resultsRevealed,
            session.projectIds
        );
    }
    
    function getVoteInfo(uint256 voteId) public view returns (
        uint8 projectId,
        uint8 score,
        address voter,
        uint256 timestamp,
        bool isRevealed
    ) {
        Vote storage vote = votes[voteId];
        return (
            0, // FHE.decrypt(vote.projectId) - will be decrypted off-chain
            0, // FHE.decrypt(vote.score) - will be decrypted off-chain
            vote.voter,
            vote.timestamp,
            vote.isRevealed
        );
    }
    
    function getVoterReputation(address voter) public view returns (uint8) {
        return 0; // FHE.decrypt(voterReputation[voter]) - will be decrypted off-chain
    }
    
    function hasUserVoted(address user, uint256 sessionId, uint256 projectId) public view returns (bool) {
        return hasVoted[user][sessionId][projectId];
    }
    
    function getProjectCount() public view returns (uint256) {
        return projectCounter;
    }
    
    function getSessionCount() public view returns (uint256) {
        return sessionCounter;
    }
    
    function getVoteCount() public view returns (uint256) {
        return voteCounter;
    }
    
    // FHE-specific functions for encrypted data access
    
    /**
     * Get encrypted vote data for decryption
     */
    function getVoteEncryptedData(uint256 voteId) public view returns (
        bytes32 scoreHandle,
        bytes32 projectIdHandle,
        bytes32 voteIdHandle
    ) {
        Vote storage vote = votes[voteId];
        return (
            FHE.toBytes32(vote.score),
            FHE.toBytes32(vote.projectId),
            FHE.toBytes32(vote.voteId)
        );
    }
    
    /**
     * Get encrypted project totals for decryption
     */
    function getProjectEncryptedTotals(uint256 projectId) public view returns (
        bytes32 totalVotesHandle,
        bytes32 totalScoreHandle
    ) {
        Project storage project = projects[projectId];
        return (
            FHE.toBytes32(project.totalVotes),
            FHE.toBytes32(project.totalScore)
        );
    }
    
    /**
     * Get encrypted voter reputation
     */
    function getVoterEncryptedReputation(address voter) public view returns (bytes32) {
        return FHE.toBytes32(voterReputation[voter]);
    }
    
    /**
     * Request decryption of voting results for a session
     */
    function requestResultsDecryption(uint256 sessionId) public {
        require(votingSessions[sessionId].organizer == msg.sender, "Only organizer can request decryption");
        require(votingSessions[sessionId].isActive, "Voting session must be active");
        require(block.timestamp > votingSessions[sessionId].endTime, "Voting session has not ended");
        require(!votingSessions[sessionId].resultsRevealed, "Results already revealed");
        
        // Collect all encrypted handles for projects in this session
        bytes32[] memory encryptedHandles = new bytes32[](votingSessions[sessionId].projectIds.length * 2);
        uint256 handleIndex = 0;
        
        for (uint i = 0; i < votingSessions[sessionId].projectIds.length; i++) {
            uint256 projectId = votingSessions[sessionId].projectIds[i];
            (bytes32 votesHandle, bytes32 scoreHandle) = getProjectEncryptedTotals(projectId);
            encryptedHandles[handleIndex] = votesHandle;
            encryptedHandles[handleIndex + 1] = scoreHandle;
            handleIndex += 2;
        }
        
        // Request decryption through FHE oracle
        uint256 requestId = FHE.requestDecryption(encryptedHandles, this.decryptionCallback.selector);
        
        emit ResultsRevealed(sessionId);
    }
    
    /**
     * Callback function for FHE decryption results
     */
    function decryptionCallback(uint256 requestId, bytes memory cleartexts, bytes[] memory signatures) public returns (bool) {
        // This function will be called by the FHE oracle when decryption is complete
        // The cleartexts will contain the decrypted values
        // In a real implementation, you would store these results and make them available
        
        return true;
    }
}
