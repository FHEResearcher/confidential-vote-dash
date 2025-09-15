# Confidential Vote Dashboard

A decentralized voting platform built with FHE (Fully Homomorphic Encryption) technology, ensuring complete privacy and confidentiality in the voting process.

## Features

- **Private Voting**: All votes are encrypted using FHE technology
- **Transparent Results**: Vote counts are verifiable without revealing individual votes
- **Wallet Integration**: Connect with popular Web3 wallets
- **Real-time Dashboard**: Live voting statistics and results
- **Secure Authentication**: Blockchain-based identity verification

## Technology Stack

- **Frontend**: React, TypeScript, Vite
- **UI Components**: shadcn/ui, Radix UI, Tailwind CSS
- **Blockchain**: Ethereum (Sepolia Testnet)
- **Wallet**: RainbowKit, Wagmi, Viem
- **Encryption**: FHE (Fully Homomorphic Encryption)
- **Smart Contracts**: Solidity with FHE support

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Web3 wallet (MetaMask, Rainbow, etc.)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/FHEResearcher/confidential-vote-dash.git
cd confidential-vote-dash
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/b18fb7e6ca7045ac83c41157ab93f990
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=2ec9743d0d0cd7fb94dee1a7e6d33475
NEXT_PUBLIC_INFURA_API_KEY=b18fb7e6ca7045ac83c41157ab93f990
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Smart Contract Deployment

The project includes FHE-enabled smart contracts for secure voting:

1. Deploy contracts to Sepolia testnet
2. Update contract addresses in the frontend configuration
3. Verify contract functionality with test votes

## Voting Process

1. **Connect Wallet**: Users connect their Web3 wallet
2. **Create/Join Vote**: Participate in existing votes or create new ones
3. **Cast Encrypted Vote**: Votes are encrypted using FHE before submission
4. **Verify Results**: View aggregated results without compromising privacy

## Security Features

- **FHE Encryption**: All sensitive data is encrypted using fully homomorphic encryption
- **Zero-Knowledge Proofs**: Verify vote integrity without revealing content
- **Decentralized Storage**: Vote data stored on blockchain
- **Audit Trail**: Immutable voting records

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Join our community discussions
- Contact: nurse-principal@alphoria.xyz

## Roadmap

- [ ] Multi-chain support
- [ ] Advanced voting mechanisms (ranked choice, etc.)
- [ ] Mobile app development
- [ ] Integration with more wallet providers
- [ ] Enhanced privacy features