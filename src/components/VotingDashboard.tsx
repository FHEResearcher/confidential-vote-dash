import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Timer
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  name: string;
  description: string;
  team: string;
  category: string;
  hasVoted: boolean;
  score?: number;
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
  const [projects, setProjects] = useState(mockProjects);
  const [votingProject, setVotingProject] = useState<string | null>(null);
  const [resultsRevealed, setResultsRevealed] = useState(false);
  const { toast } = useToast();

  const handleVote = (projectId: string, score: number) => {
    setProjects(prev => 
      prev.map(p => 
        p.id === projectId 
          ? { ...p, hasVoted: true, score }
          : p
      )
    );
    
    setVotingProject(null);
    toast({
      title: "Vote Encrypted",
      description: "Your vote has been securely recorded and encrypted.",
    });
  };

  const totalVoted = projects.filter(p => p.hasVoted).length;
  const votingProgress = (totalVoted / projects.length) * 100;

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
                              onClick={() => handleVote(project.id, score)}
                              disabled={votingProject === project.id}
                            >
                              {score}
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
                  
                  <Button 
                    onClick={() => setResultsRevealed(true)}
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};