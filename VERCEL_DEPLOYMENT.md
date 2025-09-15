# Vercel Deployment Guide for Confidential Vote Dashboard

This guide provides step-by-step instructions for deploying the Confidential Vote Dashboard to Vercel.

## Prerequisites

- Vercel account (free tier available)
- GitHub account with access to the project repository
- Node.js 18+ installed locally (for testing)

## Step 1: Prepare the Project

1. **Clone the repository** (if not already done):
   ```bash
   git clone https://github.com/FHEResearcher/confidential-vote-dash.git
   cd confidential-vote-dash
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Test locally**:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:5173` to verify the application works.

## Step 2: Deploy to Vercel

### Method 1: Using Vercel CLI (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from project directory**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Set up and deploy? **Yes**
   - Which scope? Select your account
   - Link to existing project? **No**
   - Project name: `confidential-vote-dash`
   - Directory: `./` (current directory)
   - Override settings? **No**

5. **Configure environment variables**:
   ```bash
   vercel env add VITE_CHAIN_ID
   # Enter: 11155111
   
   vercel env add VITE_RPC_URL
   # Enter: https://sepolia.infura.io/v3/b18fb7e6ca7045ac83c41157ab93f990
   
   vercel env add VITE_WALLET_CONNECT_PROJECT_ID
   # Enter: 2ec9743d0d0cd7fb94dee1a7e6d33475
   
   vercel env add VITE_INFURA_API_KEY
   # Enter: b18fb7e6ca7045ac83c41157ab93f990
   ```

6. **Redeploy with environment variables**:
   ```bash
   vercel --prod
   ```

### Method 2: Using Vercel Dashboard

1. **Go to [vercel.com](https://vercel.com)** and sign in

2. **Click "New Project"**

3. **Import from GitHub**:
   - Select "Import Git Repository"
   - Choose `FHEResearcher/confidential-vote-dash`
   - Click "Import"

4. **Configure project settings**:
   - Framework Preset: **Vite**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. **Add environment variables**:
   - Go to Project Settings → Environment Variables
   - Add the following variables:

   | Name | Value |
   |------|-------|
   | `VITE_CHAIN_ID` | `11155111` |
   | `VITE_RPC_URL` | `https://sepolia.infura.io/v3/b18fb7e6ca7045ac83c41157ab93f990` |
   | `VITE_WALLET_CONNECT_PROJECT_ID` | `2ec9743d0d0cd7fb94dee1a7e6d33475` |
   | `VITE_INFURA_API_KEY` | `b18fb7e6ca7045ac83c41157ab93f990` |

6. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete

## Step 3: Configure Custom Domain (Optional)

1. **In Vercel Dashboard**:
   - Go to your project
   - Click "Settings" → "Domains"

2. **Add custom domain**:
   - Enter your domain name
   - Follow DNS configuration instructions
   - Wait for SSL certificate to be issued

## Step 4: Smart Contract Deployment

### Deploy to Sepolia Testnet

1. **Install Hardhat** (if not already installed):
   ```bash
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   ```

2. **Create hardhat.config.js**:
   ```javascript
   require("@nomicfoundation/hardhat-toolbox");
   
   module.exports = {
     solidity: "0.8.24",
     networks: {
       sepolia: {
         url: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
         accounts: ["YOUR_PRIVATE_KEY"]
       }
     }
   };
   ```

3. **Deploy contract**:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

4. **Update environment variables**:
   - Add `VITE_VOTING_CONTRACT_ADDRESS` with the deployed contract address
   - Redeploy the frontend

## Step 5: Post-Deployment Configuration

1. **Update contract addresses** in Vercel environment variables:
   - `VITE_VOTING_CONTRACT_ADDRESS`: Your deployed contract address
   - `VITE_FHE_CONTRACT_ADDRESS`: FHE contract address (if separate)

2. **Test the deployment**:
   - Visit your Vercel URL
   - Connect a wallet (MetaMask, Rainbow, etc.)
   - Switch to Sepolia testnet
   - Test voting functionality

## Step 6: Monitoring and Maintenance

1. **Monitor deployments**:
   - Check Vercel dashboard for build status
   - Monitor function logs for errors

2. **Update environment variables**:
   - Use Vercel CLI: `vercel env add VARIABLE_NAME`
   - Or use dashboard: Project Settings → Environment Variables

3. **Redeploy after changes**:
   ```bash
   vercel --prod
   ```

## Troubleshooting

### Common Issues

1. **Build failures**:
   - Check Node.js version (should be 18+)
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Environment variables not working**:
   - Ensure variables start with `VITE_`
   - Redeploy after adding new variables
   - Check variable names match exactly

3. **Wallet connection issues**:
   - Verify WalletConnect Project ID is correct
   - Check RPC URL is accessible
   - Ensure user is on correct network (Sepolia)

4. **Contract interaction failures**:
   - Verify contract address is correct
   - Check contract is deployed on Sepolia
   - Ensure user has testnet ETH

### Support

- **Vercel Documentation**: https://vercel.com/docs
- **Project Issues**: Create an issue on GitHub
- **Contact**: nurse-principal@alphoria.xyz

## Environment Variables Reference

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `VITE_CHAIN_ID` | Ethereum chain ID | `11155111` (Sepolia) |
| `VITE_RPC_URL` | RPC endpoint URL | `https://sepolia.infura.io/v3/...` |
| `VITE_WALLET_CONNECT_PROJECT_ID` | WalletConnect project ID | `2ec9743d0d0cd7fb94dee1a7e6d33475` |
| `VITE_INFURA_API_KEY` | Infura API key | `b18fb7e6ca7045ac83c41157ab93f990` |
| `VITE_VOTING_CONTRACT_ADDRESS` | Deployed contract address | `0x...` |
| `VITE_FHE_CONTRACT_ADDRESS` | FHE contract address | `0x...` |

## Deployment Checklist

- [ ] Project builds successfully locally
- [ ] All environment variables configured
- [ ] Smart contracts deployed to Sepolia
- [ ] Contract addresses updated in environment
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate issued
- [ ] Wallet connection tested
- [ ] Voting functionality tested
- [ ] Error monitoring set up
