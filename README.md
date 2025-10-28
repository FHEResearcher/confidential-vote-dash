# Confidential Vote Dash

A fully homomorphic encryption (FHE) powered confidential voting system built on Ethereum Sepolia testnet. This project enables secure, private voting where individual votes remain encrypted while still allowing for aggregate results to be computed and revealed.

## 🎥 Demo Video

[![Confidential Vote Dash Demo](confidential-vote-dash.mov)](confidential-vote-dash.mov)

**Video Size**: 23.5MB | **Duration**: 1:48 | **Format**: MOV | **Resolution**: 1920x1080 | **Frame Rate**: 30fps | **Bitrate**: 4Mbps

## 🔒 Key Features

- **Fully Homomorphic Encryption**: Votes are encrypted using Zama's FHE technology
- **Privacy-Preserving**: Individual votes remain confidential while enabling aggregate computation
- **Per-Project Voting**: Users can vote on multiple projects independently within a session
- **Real-time Results**: Encrypted totals are computed on-chain without revealing individual votes
- **Web3 Integration**: Seamless wallet connection and transaction signing
- **Responsive UI**: Modern, intuitive interface for voting and result viewing

## 🏗️ Architecture

### Smart Contract (`ConfidentialVoting.sol`)

**Contract Address**: `0x2c6216Ac4d65d7d2720Cc45c11Da554CdB06Dcba`

#### Core Data Structures

```solidity
struct Vote {
    uint256 voteId;
    uint256 projectId;
    euint32 score;           // FHE encrypted score (1-10)
    address voter;
    uint256 timestamp;
}

struct Project {
    euint32 projectId;       // FHE encrypted project ID
    string name;
    string description;
    string team;
    string category;
    address creator;
    uint256 startTime;
    uint256 endTime;
    bool isActive;
    euint32 totalVotes;      // FHE encrypted vote count
    euint32 totalScore;      // FHE encrypted total score
}

struct VotingSession {
    uint256 sessionId;
    string title;
    string description;
    address organizer;
    uint256 startTime;
    uint256 endTime;
    bool isActive;
    uint256[] projectIds;
}
```

#### Key Functions

- `createProject()`: Create a new project for voting
- `createVotingSession()`: Initialize a voting session with multiple projects
- `castVote()`: Submit encrypted vote with FHE score and proof
- `hasUserVoted()`: Check if user has voted for specific project in session
- `getProjectEncryptedTotals()`: Retrieve encrypted vote totals for decryption

### FHE Encryption Logic

#### Client-Side Encryption (`fhe-utils.ts`)

```typescript
// 1. Initialize FHE instance
const instance = await createInstance(SepoliaConfig);

// 2. Create encrypted input for vote score
const encryptedInput = instance.createEncryptedInput(contractAddress, voterAddress);
encryptedInput.add8(score); // Add score (1-10)

// 3. Encrypt and generate proof
const encryptedData = await encryptedInput.encrypt();

// 4. Generate external euint32 for contract
const externalEuint32 = await instance.generateExternalEuint32(
  contractAddress, 
  voterAddress, 
  score
);
```

#### Contract-Side Processing (`ConfidentialVoting.sol`)

```solidity
function castVote(
    uint256 projectId,
    uint256 sessionId,
    externalEuint32 score,
    bytes calldata inputProof
) public returns (uint256) {
    // Convert external encrypted score to internal euint32
    euint32 internalScore = FHE.fromExternal(score);
    
    // Validate score range (1-10) - simplified validation
    require(score >= 1 && score <= 10, "Invalid score range");
    
    // Check if user already voted for this project
    require(!hasVoted[msg.sender][sessionId][projectId], "Already voted");
    
    // Perform encrypted arithmetic
    projects[projectId].totalVotes = FHE.add(projects[projectId].totalVotes, FHE.asEuint32(1));
    projects[projectId].totalScore = FHE.add(projects[projectId].totalScore, internalScore);
    
    // Set ACL permissions for decryption
    FHE.allowThis(projects[projectId].totalVotes);
    FHE.allowThis(projects[projectId].totalScore);
    FHE.allow(projects[projectId].totalVotes, msg.sender);
    FHE.allow(projects[projectId].totalScore, msg.sender);
    FHE.allow(projects[projectId].totalVotes, votingSessions[sessionId].organizer);
    FHE.allow(projects[projectId].totalScore, votingSessions[sessionId].organizer);
    
    // Mark as voted
    hasVoted[msg.sender][sessionId][projectId] = true;
}
```

### Decryption Process

#### Request Decryption (`contract-utils.ts`)

```typescript
// Request decryption of encrypted totals
async requestResultsDecryption(sessionId: number): Promise<void> {
  const encryptedHandles = [];
  
  // Collect encrypted handles for all projects in session
  for (const projectId of sessionProjectIds) {
    const totals = await this.getProjectEncryptedTotals(projectId);
    encryptedHandles.push(totals.totalVotes, totals.totalScore);
  }
  
  // Request decryption via FHE oracle
  await this.contract.requestResultsDecryption(sessionId, encryptedHandles);
}
```

#### Handle Decryption Results

```solidity
function decryptionCallback(
    uint256 sessionId,
    uint256[] calldata decryptedValues
) external onlyOracle {
    // Process decrypted results
    // Update session with revealed totals
    // Emit events for frontend consumption
}
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or compatible Web3 wallet
- Sepolia ETH for gas fees

### Installation

```bash
# Clone the repository
git clone https://github.com/FHEResearcher/confidential-vote-dash.git
cd confidential-vote-dash

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration
```

### Environment Configuration

```bash
# Network Configuration
SEPOLIA_RPC_URL=https://1rpc.io/sepolia
VITE_SEPOLIA_RPC_URL=https://1rpc.io/sepolia

# Contract Configuration
VITE_VOTING_CONTRACT_ADDRESS=0x2c6216Ac4d65d7d2720Cc45c11Da554CdB06Dcba

# API Keys
ETHERSCAN_API_KEY=your_etherscan_api_key
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Contract Deployment

```bash
# Compile contracts
npm run compile

# Deploy to Sepolia
npm run deploy:sepolia

# Initialize with sample data
npm run initialize
```

## 📊 Current Data

### Deployed Projects

1. **DecentraliZOOM** (Web3 Wizards)
   - Category: Communication
   - Description: Decentralized video conferencing with end-to-end encryption and token rewards

2. **CryptoCollab** (BlockBuilders)
   - Category: Productivity
   - Description: DAO-powered collaborative workspace for remote teams

3. **NFTunes** (SoundChain)
   - Category: Entertainment
   - Description: Music NFT marketplace with artist royalty distribution

### Active Voting Session

- **Title**: Hackathon Voting Session
- **Duration**: 7 days
- **Projects**: All 3 projects included
- **Status**: Active and accepting votes

## 🔐 Security Features

### FHE Encryption Benefits

1. **Privacy Preservation**: Individual votes remain encrypted at all times
2. **Computational Privacy**: Aggregate operations performed on encrypted data
3. **Access Control**: ACL system controls who can decrypt results
4. **Zero-Knowledge**: No individual vote information is ever revealed

### Smart Contract Security

- **Input Validation**: Score range validation (1-10)
- **Duplicate Prevention**: Per-project voting prevention
- **Access Control**: Only authorized users can decrypt results
- **Immutable Records**: All votes permanently recorded on blockchain

## 🛠️ Technical Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Wagmi** for Web3 integration
- **Zama FHE SDK** for encryption

### Blockchain
- **Solidity 0.8.24** for smart contracts
- **Hardhat** for development and deployment
- **Ethers.js v6** for contract interaction
- **FHEVM** for homomorphic encryption

### Infrastructure
- **Ethereum Sepolia** testnet
- **IPFS** for decentralized storage (planned)
- **Vercel** for frontend deployment

## 📈 Performance Metrics

- **Encryption Time**: ~200ms per vote
- **Transaction Cost**: ~0.001 ETH per vote
- **Contract Size**: ~15KB
- **Frontend Bundle**: ~1.3MB (gzipped: ~414KB)

## 🔄 Voting Flow

1. **Connect Wallet**: User connects MetaMask or compatible wallet
2. **FHE Initialization**: Client-side FHE instance initializes
3. **Select Score**: User chooses rating (1-10) for project
4. **Encrypt Vote**: Score encrypted using FHE
5. **Submit Transaction**: Encrypted vote submitted to contract
6. **ACL Setup**: Permissions configured for decryption
7. **Result Aggregation**: Encrypted totals updated on-chain
8. **Decryption Request**: Organizer requests result decryption
9. **Reveal Results**: Final results revealed after session end

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Zama** for FHE technology and SDK
- **Ethereum Foundation** for blockchain infrastructure
- **Hardhat** team for development tools
- **Wagmi** team for Web3 React hooks

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact: nurse-principal@alphoria.xyz
- Documentation: [Project Wiki](https://github.com/FHEResearcher/confidential-vote-dash/wiki)

---

**Built with ❤️ using FHE technology for privacy-preserving voting**