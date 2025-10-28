import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Vote, 
  Eye, 
  EyeOff, 
  Users, 
  Trophy, 
  Star,
  LogOut,
  Lock,
  Unlock,
  Timer,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { contractVotingUtils, ProjectInfo, VotingSessionInfo, CONFIDENTIAL_VOTING_ABI } from "@/lib/contract-utils";
import { fheVotingUtils } from "@/lib/fhe-utils";
import { useZamaInstance } from "@/hooks/useZamaInstance";
import { useEthersSigner } from "@/hooks/useEthersSigner";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";

interface Project {
  id: string;
  name: string;
  description: string;
  team: string;
  category: string;
  hasVoted: boolean;
  score?: number;
  voteId?: number;
  encryptedVote?: string;
}

interface VotingDashboardProps {
  walletAddress: string;
  onDisconnect: () => void;
}

const mockProjects: Project[] = [
  {
    id: "1",
    name: "DecentraliZOOM",
    description: "Decentralized video conferencing with end-to-end encryption and token rewards",
    team: "Web3 Wizards",
    category: "Communication",
    hasVoted: false
  },
  {
    id: "2", 
    name: "CryptoCollab",
    description: "DAO-powered collaborative workspace for remote teams",
    team: "BlockBuilders",
    category: "Productivity",
    hasVoted: true,
    score: 8.5
  },
  {
    id: "3",
    name: "NFTunes",
    description: "Music NFT marketplace with artist royalty distribution",
    team: "SoundChain",
    category: "Entertainment",
    hasVoted: false
  }
];

export const VotingDashboard = ({ walletAddress, onDisconnect }: VotingDashboardProps) => {
  const { address } = useAccount();
  const { instance, isLoading: isZamaLoading, error: zamaError } = useZamaInstance();
  const signerPromise = useEthersSigner();
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [votingProject, setVotingProject] = useState<string | null>(null);
  const [resultsRevealed, setResultsRevealed] = useState(false);
  const [showVoteConfirm, setShowVoteConfirm] = useState(false);
  const [pendingVote, setPendingVote] = useState<{projectId: string, score: number, projectName: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSession, setCurrentSession] = useState<VotingSessionInfo | null>(null);
  const { toast } = useToast();

  // Load projects and session data on component mount
  useEffect(() => {
    loadVotingData();
  }, []);

  const loadVotingData = async () => {
    try {
      setLoading(true);
      
      // Load current voting session
      const sessionCount = await contractVotingUtils.getSessionCount();
      if (sessionCount > 0) {
        const sessionInfo = await contractVotingUtils.getVotingSessionInfo(0);
        setCurrentSession(sessionInfo);
        
        if (sessionInfo) {
          // Load projects for this session
          const projectPromises = sessionInfo.projectIds.map(async (projectId) => {
            const projectInfo = await contractVotingUtils.getProjectInfo(Number(projectId));
            // Check if user has voted for this specific project in this session
            const hasVoted = address ? await contractVotingUtils.hasUserVoted(address, 0, Number(projectId)) : false;
            
            return {
              id: projectId.toString(),
              name: projectInfo?.name || `Project ${projectId}`,
              description: projectInfo?.description || `Description for project ${projectId}`,
              team: projectInfo?.team || `Team ${projectId}`,
              category: projectInfo?.category || 'Technology',
              hasVoted,
              score: undefined,
              voteId: undefined,
              encryptedVote: undefined
            };
          });
          
          const loadedProjects = await Promise.all(projectPromises);
          setProjects(loadedProjects);
          
          // Check if results are revealed
          setResultsRevealed(sessionInfo.resultsRevealed);
        }
      } else {
        // Fallback to mock data if no session exists
        setProjects(mockProjects);
      }
    } catch (error) {
      console.error('Failed to load voting data:', error);
      toast({
        title: "Error",
        description: "Failed to load voting data. Using demo data.",
        variant: "destructive"
      });
      setProjects(mockProjects);
    } finally {
      setLoading(false);
    }
  };

  const handleVoteClick = (projectId: string, score: number) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setPendingVote({
        projectId,
        score,
        projectName: project.name
      });
      setShowVoteConfirm(true);
    }
  };

  const confirmVote = async () => {
    if (!pendingVote) return;
    
    // Check if FHE instance and wallet are ready
    if (!instance || !address || !signerPromise) {
      toast({
        title: "Missing Requirements",
        description: "Please ensure your wallet is connected and FHE service is initialized.",
        variant: "destructive"
      });
      return;
    }

    setVotingProject(pendingVote.projectId);
    
    try {
      // Encrypt vote data using FHE
      const encryptedVote = await fheVotingUtils.encryptVote({
        projectId: parseInt(pendingVote.projectId),
        score: pendingVote.score,
        sessionId: 0, // Current session
        voterAddress: address
      });

      // Generate encrypted data for contract call
      const externalEuint32 = await fheVotingUtils.generateExternalEuint32(pendingVote.score, address);
      
      console.log('🔄 Calling contract to cast encrypted vote...');
      console.log('📊 Contract call parameters:', {
        projectId: parseInt(pendingVote.projectId),
        sessionId: 0,
        scoreBytes: externalEuint32.encrypted.substring(0, 20) + '...',
        proofLength: externalEuint32.proof.length
      });

      // Make actual contract call using wagmi
      const transactionHash = await writeContractAsync({
        address: import.meta.env.VITE_VOTING_CONTRACT_ADDRESS as `0x${string}`,
        abi: CONFIDENTIAL_VOTING_ABI,
        functionName: 'castVote',
        args: [
          BigInt(parseInt(pendingVote.projectId)),
          BigInt(0), // Current session
          externalEuint32.encrypted as `0x${string}`,
          externalEuint32.proof as `0x${string}`
        ],
      });

      console.log('✅ Vote cast successfully! Transaction hash:', transactionHash);

      if (transactionHash) {
        // Update local state - only mark the specific project as voted
        setProjects(prev => 
          prev.map(p => 
            p.id === pendingVote.projectId 
              ? { 
                  ...p, 
                  hasVoted: true, 
                  score: pendingVote.score,
                  voteId: parseInt(pendingVote.projectId), // Use projectId as voteId
                  encryptedVote: encryptedVote.encryptedScore
                }
              : p // Keep other projects unchanged
          )
        );
        
        toast({
          title: "Vote Encrypted & Recorded",
          description: `Your vote for "${pendingVote.projectName}" has been securely encrypted and submitted to the blockchain. Transaction: ${transactionHash.substring(0, 10)}...`,
        });
      } else {
        throw new Error('Failed to cast vote - no transaction hash returned');
      }
    } catch (error) {
      console.error('Vote casting failed:', error);
      toast({
        title: "Vote Failed",
        description: error instanceof Error ? error.message : "Failed to cast vote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setVotingProject(null);
      setShowVoteConfirm(false);
      setPendingVote(null);
    }
  };

  const cancelVote = () => {
    setShowVoteConfirm(false);
    setPendingVote(null);
  };

  const totalVoted = projects.filter(p => p.hasVoted).length;
  const votingProgress = (totalVoted / projects.length) * 100;

  const handleRevealResults = async () => {
    try {
      const result = await contractVotingUtils.revealResults(0); // Current session
      
      if (result.success) {
        setResultsRevealed(true);
        toast({
          title: "Results Revealed",
          description: "Voting results have been successfully revealed on the blockchain.",
        });
      } else {
        throw new Error(result.error || 'Failed to reveal results');
      }
    } catch (error) {
      console.error('Results reveal failed:', error);
      toast({
        title: "Reveal Failed",
        description: error instanceof Error ? error.message : "Failed to reveal results. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Header */}
      <header className="border-b border-border/20 bg-card/5 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Judging Made Confidential
              </h1>
              <p className="text-sm text-muted-foreground">Hackathon Judge Portal</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="border-primary/30 text-primary">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </Badge>
            <Button variant="outline" size="sm" onClick={onDisconnect}>
              <LogOut className="w-4 h-4 mr-1" />
              Disconnect
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Loading voting data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-card border-border/20">
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{projects.length}</p>
              <p className="text-sm text-muted-foreground">Total Projects</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border/20">
            <CardContent className="p-4 text-center">
              <Vote className="w-6 h-6 mx-auto mb-2 text-encrypted" />
              <p className="text-2xl font-bold">{totalVoted}</p>
              <p className="text-sm text-muted-foreground">Votes Cast</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border/20">
            <CardContent className="p-4 text-center">
              <Timer className="w-6 h-6 mx-auto mb-2 text-success" />
              <p className="text-2xl font-bold">{votingProgress.toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground">Progress</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border/20">
            <CardContent className="p-4 text-center">
              {resultsRevealed ? (
                <Unlock className="w-6 h-6 mx-auto mb-2 text-success" />
              ) : (
                <Lock className="w-6 h-6 mx-auto mb-2 text-encrypted" />
              )}
              <p className="text-sm font-bold">
                {resultsRevealed ? "Revealed" : "Encrypted"}
              </p>
              <p className="text-sm text-muted-foreground">Results Status</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="voting" className="space-y-6">
          <TabsList className="bg-muted/20">
            <TabsTrigger value="voting">Voting</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="voting" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="bg-gradient-card border-border/20 hover:shadow-glow-primary/20 transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">by {project.team}</p>
                        <Badge variant="secondary" className="w-fit">
                          {project.category}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {project.hasVoted ? (
                          <Badge className="bg-success text-success-foreground">
                            <Vote className="w-3 h-3 mr-1" />
                            Voted
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-encrypted text-encrypted">
                            <Timer className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                    
                    {!project.hasVoted && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>Rate this project:</span>
                          <span className="text-muted-foreground">1-10 scale</span>
                        </div>
                        
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                              <Button
                                key={score}
                                variant="outline"
                                size="sm"
                                className="w-8 h-8 p-0 hover:bg-primary/20 hover:border-primary/30"
                                onClick={() => handleVoteClick(project.id, score)}
                                disabled={votingProject === project.id}
                              >
                                {votingProject === project.id ? (
                                  <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  score
                                )}
                              </Button>
                            ))}
                          </div>
                      </div>
                    )}
                    
                    {project.hasVoted && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/20">
                        <span className="text-sm text-success-foreground">Vote recorded and encrypted</span>
                        <Shield className="w-4 h-4 text-success" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {!resultsRevealed ? (
              <div className="text-center py-8">
                <Card className="bg-gradient-card border-border/20 max-w-md mx-auto">
                  <CardContent className="p-8 text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-encrypted/20 flex items-center justify-center">
                      <Lock className="w-8 h-8 text-encrypted" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">Results Encrypted</h3>
                      <p className="text-muted-foreground">
                        Voting results will be revealed after the judging period ends
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Progress value={votingProgress} className="h-2" />
                      <p className="text-sm text-muted-foreground">
                        {totalVoted} of {projects.length} projects voted
                      </p>
                    </div>
                    
                    <Button 
                      onClick={handleRevealResults}
                      className="bg-encrypted hover:bg-encrypted/90 text-encrypted-foreground hover:shadow-glow-encrypted transition-all duration-300"
                      disabled={totalVoted < projects.length}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Reveal Results
                    </Button>
                    
                    {totalVoted < projects.length && (
                      <p className="text-xs text-muted-foreground">
                        Complete all votes to enable results reveal
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center py-4">
                  <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-success/20 border border-success/30">
                    <Unlock className="w-5 h-5 text-success" />
                    <span className="font-medium text-success-foreground">Results Revealed</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {projects
                    .filter(p => p.hasVoted && p.score)
                    .sort((a, b) => (b.score || 0) - (a.score || 0))
                    .map((project, index) => (
                    <Card key={project.id} className="bg-gradient-card border-border/20 hover:shadow-glow-primary/20 transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <CardTitle className="text-lg">{project.name}</CardTitle>
                              {index < 3 && (
                                <Badge className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border-yellow-500/30">
                                  <Trophy className="w-3 h-3 mr-1" />
                                  #{index + 1}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">by {project.team}</p>
                            <Badge variant="secondary" className="w-fit">
                              {project.category}
                            </Badge>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              {project.score?.toFixed(1)}
                            </div>
                            <div className="flex items-center justify-end">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-4 h-4 ${
                                    i < (project.score || 0) / 2 
                                      ? 'text-yellow-400 fill-yellow-400' 
                                      : 'text-muted-foreground'
                                  }`} 
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Vote Confirmation Dialog */}
        <Dialog open={showVoteConfirm} onOpenChange={setShowVoteConfirm}>
          <DialogContent className="bg-gradient-card border-border/20">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Vote className="w-5 h-5 text-primary" />
                <span>Confirm Your Vote</span>
              </DialogTitle>
              <DialogDescription>
                You are about to submit an encrypted vote that cannot be changed.
              </DialogDescription>
            </DialogHeader>
            
            {pendingVote && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/20 border border-border/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{pendingVote.projectName}</h4>
                      <p className="text-sm text-muted-foreground">Your score</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{pendingVote.score}</div>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${
                              i < pendingVote.score / 2 
                                ? 'text-yellow-400 fill-yellow-400' 
                                : 'text-muted-foreground'
                            }`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-encrypted/10 border border-encrypted/20">
                  <Shield className="w-5 h-5 text-encrypted flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-encrypted-foreground font-medium">End-to-End Encryption</p>
                    <p className="text-muted-foreground">Your vote will be encrypted and remain confidential until results are revealed.</p>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={cancelVote}>
                Cancel
              </Button>
              <Button 
                onClick={confirmVote}
                className="bg-primary hover:bg-primary/90"
                disabled={votingProject !== null}
              >
                {votingProject === pendingVote?.projectId ? (
                  <>
                    <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Encrypting Vote...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Vote
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
          </>
        )}
      </div>
    </div>
  );
};