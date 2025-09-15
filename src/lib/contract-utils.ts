// Contract interaction utilities for confidential voting
import { Contract, parseEther, formatEther } from 'viem';
import { useWriteContract, useReadContract, useAccount } from 'wagmi';
import { fheVotingUtils, VoteData, EncryptedVote } from './fhe-utils';

// Contract ABI for ConfidentialVoting
export const CONFIDENTIAL_VOTING_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_verifier",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "voteId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "projectId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "voter",
        "type": "address"
      }
    ],
    "name": "VoteCast",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "projectId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      }
    ],
    "name": "ProjectCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "sessionId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "organizer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "title",
        "type": "string"
      }
    ],
    "name": "VotingSessionCreated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "projectId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "sessionId",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "score",
        "type": "bytes"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "castVote",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_team",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_category",
        "type": "string"
      }
    ],
    "name": "createProject",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_description",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_duration",
        "type": "uint256"
      },
      {
        "internalType": "uint256[]",
        "name": "_projectIds",
        "type": "uint256[]"
      }
    ],
    "name": "createVotingSession",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "sessionId",
        "type": "uint256"
      }
    ],
    "name": "revealResults",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "projectId",
        "type": "uint256"
      }
    ],
    "name": "getProjectInfo",
    "outputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "team",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "category",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "startTime",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "uint8",
        "name": "totalVotes",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "totalScore",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "sessionId",
        "type": "uint256"
      }
    ],
    "name": "getVotingSessionInfo",
    "outputs": [
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "organizer",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "startTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "endTime",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "resultsRevealed",
        "type": "bool"
      },
      {
        "internalType": "uint256[]",
        "name": "projectIds",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "sessionId",
        "type": "uint256"
      }
    ],
    "name": "hasUserVoted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getProjectCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getSessionCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export interface ProjectInfo {
  name: string;
  description: string;
  team: string;
  category: string;
  creator: string;
  startTime: bigint;
  isActive: boolean;
  totalVotes: number;
  totalScore: number;
}

export interface VotingSessionInfo {
  title: string;
  description: string;
  organizer: string;
  startTime: bigint;
  endTime: bigint;
  isActive: boolean;
  resultsRevealed: boolean;
  projectIds: bigint[];
}

export class ContractVotingUtils {
  private contractAddress: string;
  private contract: Contract | null = null;

  constructor(contractAddress: string) {
    this.contractAddress = contractAddress;
  }

  /**
   * Cast an encrypted vote on the blockchain
   */
  async castVote(
    projectId: number,
    sessionId: number,
    score: number,
    voterAddress: string
  ): Promise<{
    success: boolean;
    voteId?: number;
    error?: string;
  }> {
    try {
      // Encrypt the vote data using FHE
      const voteData: VoteData = {
        projectId,
        score,
        sessionId,
        voterAddress
      };

      const encryptedVote = await fheVotingUtils.encryptVote(voteData);
      
      // Prepare contract call data
      const externalEuint32 = await fheVotingUtils.generateExternalEuint32(score);
      
      // Convert to bytes for contract call
      const scoreBytes = new TextEncoder().encode(externalEuint32.encrypted);
      const proofBytes = new TextEncoder().encode(externalEuint32.proof);

      // This would be the actual contract call
      // const result = await contract.castVote(projectId, sessionId, scoreBytes, proofBytes);
      
      // Simulate successful vote
      const voteId = Math.floor(Math.random() * 1000000);
      
      return {
        success: true,
        voteId
      };
    } catch (error) {
      console.error('Failed to cast vote:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a new project
   */
  async createProject(
    name: string,
    description: string,
    team: string,
    category: string
  ): Promise<{
    success: boolean;
    projectId?: number;
    error?: string;
  }> {
    try {
      // This would be the actual contract call
      // const result = await contract.createProject(name, description, team, category);
      
      // Simulate successful project creation
      const projectId = Math.floor(Math.random() * 1000000);
      
      return {
        success: true,
        projectId
      };
    } catch (error) {
      console.error('Failed to create project:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a new voting session
   */
  async createVotingSession(
    title: string,
    description: string,
    duration: number,
    projectIds: number[]
  ): Promise<{
    success: boolean;
    sessionId?: number;
    error?: string;
  }> {
    try {
      // This would be the actual contract call
      // const result = await contract.createVotingSession(title, description, duration, projectIds);
      
      // Simulate successful session creation
      const sessionId = Math.floor(Math.random() * 1000000);
      
      return {
        success: true,
        sessionId
      };
    } catch (error) {
      console.error('Failed to create voting session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Reveal voting results
   */
  async revealResults(sessionId: number): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // This would be the actual contract call
      // await contract.revealResults(sessionId);
      
      // Simulate successful results reveal
      return {
        success: true
      };
    } catch (error) {
      console.error('Failed to reveal results:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get project information
   */
  async getProjectInfo(projectId: number): Promise<ProjectInfo | null> {
    try {
      // This would be the actual contract call
      // const result = await contract.getProjectInfo(projectId);
      
      // Return mock data for now
      return {
        name: `Project ${projectId}`,
        description: `Description for project ${projectId}`,
        team: `Team ${projectId}`,
        category: 'Technology',
        creator: '0x0000000000000000000000000000000000000000',
        startTime: BigInt(Date.now()),
        isActive: true,
        totalVotes: 0,
        totalScore: 0
      };
    } catch (error) {
      console.error('Failed to get project info:', error);
      return null;
    }
  }

  /**
   * Get voting session information
   */
  async getVotingSessionInfo(sessionId: number): Promise<VotingSessionInfo | null> {
    try {
      // This would be the actual contract call
      // const result = await contract.getVotingSessionInfo(sessionId);
      
      // Return mock data for now
      return {
        title: `Voting Session ${sessionId}`,
        description: `Description for session ${sessionId}`,
        organizer: '0x0000000000000000000000000000000000000000',
        startTime: BigInt(Date.now()),
        endTime: BigInt(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        isActive: true,
        resultsRevealed: false,
        projectIds: [BigInt(1), BigInt(2), BigInt(3)]
      };
    } catch (error) {
      console.error('Failed to get voting session info:', error);
      return null;
    }
  }

  /**
   * Check if user has voted in a session
   */
  async hasUserVoted(userAddress: string, sessionId: number): Promise<boolean> {
    try {
      // This would be the actual contract call
      // const result = await contract.hasUserVoted(userAddress, sessionId);
      
      // Return mock data for now
      return false;
    } catch (error) {
      console.error('Failed to check vote status:', error);
      return false;
    }
  }

  /**
   * Get total project count
   */
  async getProjectCount(): Promise<number> {
    try {
      // This would be the actual contract call
      // const result = await contract.getProjectCount();
      
      // Return mock data for now
      return 3;
    } catch (error) {
      console.error('Failed to get project count:', error);
      return 0;
    }
  }

  /**
   * Get total session count
   */
  async getSessionCount(): Promise<number> {
    try {
      // This would be the actual contract call
      // const result = await contract.getSessionCount();
      
      // Return mock data for now
      return 1;
    } catch (error) {
      console.error('Failed to get session count:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const contractVotingUtils = new ContractVotingUtils(
  import.meta.env.VITE_VOTING_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'
);
