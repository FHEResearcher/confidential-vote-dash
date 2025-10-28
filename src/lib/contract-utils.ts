// Contract interaction utilities for confidential voting
import { Contract } from 'viem';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
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
        "internalType": "bytes32",
        "name": "score",
        "type": "bytes32"
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
        },
        {
          "internalType": "uint256",
          "name": "projectId",
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
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "projectId",
        "type": "uint256"
      }
    ],
    "name": "getProjectEncryptedTotals",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "totalVotesHandle",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "totalScoreHandle",
        "type": "bytes32"
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
  private client = createPublicClient({
    chain: sepolia,
    transport: http(import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://1rpc.io/sepolia')
  });

  constructor(contractAddress: string) {
    this.contractAddress = contractAddress;
  }

  /**
   * Read contract data using wagmi's readContract
   */
  private async readContract(params: any) {
    return {
      data: await this.client.readContract({
        address: params.address,
        abi: params.abi,
        functionName: params.functionName,
        args: params.args
      })
    };
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
      const externalEuint32 = await fheVotingUtils.generateExternalEuint32(score, voterAddress);
      
      // Convert to proper format for contract call
      const scoreBytes = externalEuint32.encrypted as `0x${string}`;
      const proofBytes = externalEuint32.proof as `0x${string}`;

      console.log('🔄 Calling contract to cast encrypted vote...');
      console.log('📊 Contract call parameters:', {
        projectId,
        sessionId,
        scoreBytes: scoreBytes.substring(0, 20) + '...',
        proofLength: proofBytes.length
      });

      // Make actual contract call using wagmi
      const { writeContractAsync } = await import('wagmi');
      
      const result = await writeContractAsync({
        address: this.contractAddress as `0x${string}`,
        abi: CONFIDENTIAL_VOTING_ABI,
        functionName: 'castVote',
        args: [
          BigInt(projectId),
          BigInt(sessionId),
          scoreBytes,
          proofBytes
        ],
      });

      console.log('✅ Vote cast successfully! Transaction hash:', result);
      
      return {
        success: true,
        transactionHash: result,
        voteId: projectId // Use projectId as voteId for now
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
      // Use wagmi's useReadContract hook equivalent
      const { data: result } = await this.readContract({
        address: this.contractAddress as `0x${string}`,
        abi: CONFIDENTIAL_VOTING_ABI,
        functionName: 'getProjectInfo',
        args: [BigInt(projectId)]
      });
      
      if (result) {
        return {
          name: result[0] || `Project ${projectId}`,
          description: result[1] || `Description for project ${projectId}`,
          team: result[2] || `Team ${projectId}`,
          category: result[3] || 'Technology',
          creator: result[4] || '0x0000000000000000000000000000000000000000',
          startTime: result[5] || BigInt(Date.now()),
          isActive: result[6] || true,
          totalVotes: result[7] || 0,
          totalScore: result[8] || 0
        };
      }
      
      return null;
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
      // Use wagmi's useReadContract hook equivalent
      const { data: result } = await this.readContract({
        address: this.contractAddress as `0x${string}`,
        abi: CONFIDENTIAL_VOTING_ABI,
        functionName: 'getVotingSessionInfo',
        args: [BigInt(sessionId)]
      });
      
      if (result) {
        return {
          title: result[0] || `Voting Session ${sessionId}`,
          description: result[1] || `Description for session ${sessionId}`,
          organizer: result[2] || '0x0000000000000000000000000000000000000000',
          startTime: result[3] || BigInt(Date.now()),
          endTime: result[4] || BigInt(Date.now() + 7 * 24 * 60 * 60 * 1000),
          isActive: result[5] || true,
          resultsRevealed: result[6] || false,
          projectIds: result[7] || [BigInt(1), BigInt(2), BigInt(3)]
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get voting session info:', error);
      return null;
    }
  }

  /**
   * Check if user has voted in a session
   */
  async hasUserVoted(userAddress: string, sessionId: number, projectId: number): Promise<boolean> {
    try {
      const { data } = await this.readContract({
        address: this.contractAddress as `0x${string}`,
        abi: CONFIDENTIAL_VOTING_ABI,
        functionName: 'hasUserVoted',
        args: [userAddress as `0x${string}`, BigInt(sessionId), BigInt(projectId)]
      });
      return Boolean(data);
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
      const { data } = await this.readContract({
        address: this.contractAddress as `0x${string}`,
        abi: CONFIDENTIAL_VOTING_ABI,
        functionName: 'getProjectCount'
      });
      return Number(data ?? 0);
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
      // Use wagmi's useReadContract hook equivalent
      const { data: result } = await this.readContract({
        address: this.contractAddress as `0x${string}`,
        abi: CONFIDENTIAL_VOTING_ABI,
        functionName: 'getSessionCount'
      });
      
      return result ? Number(result) : 0;
    } catch (error) {
      console.error('Failed to get session count:', error);
      return 0;
    }
  }

  /**
   * Get encrypted project totals for decryption
   */
  async getProjectEncryptedTotals(projectId: number): Promise<{
    totalVotesHandle: string;
    totalScoreHandle: string;
  } | null> {
    try {
      const { data } = await this.readContract({
        address: this.contractAddress as `0x${string}`,
        abi: CONFIDENTIAL_VOTING_ABI,
        functionName: 'getProjectEncryptedTotals',
        args: [BigInt(projectId)]
      });
      if (data && Array.isArray(data) && data.length === 2) {
        return {
          totalVotesHandle: data[0] as string,
          totalScoreHandle: data[1] as string
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get encrypted totals:', error);
      return null;
    }
  }
}

// Export singleton instance
export const contractVotingUtils = new ContractVotingUtils(
  import.meta.env.VITE_VOTING_CONTRACT_ADDRESS || '0x2c6216Ac4d65d7d2720Cc45c11Da554CdB06Dcba'
);
