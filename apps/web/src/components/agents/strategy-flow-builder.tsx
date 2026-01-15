"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Plus,
  Trash2,
  ArrowRight,
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  Zap,
} from "lucide-react";

export interface StrategyNode {
  id: string;
  type: "trigger" | "condition" | "action" | "rebalance";
  label: string;
  config: Record<string, any>;
}

export interface StrategyFlow {
  id: string;
  name: string;
  nodes: StrategyNode[];
  isActive: boolean;
}

interface StrategyFlowBuilderProps {
  onSave: (flow: StrategyFlow) => void;
  onDeploy: (flow: StrategyFlow) => Promise<void>;
  initialFlow?: StrategyFlow;
}

const NODE_TEMPLATES = {
  trigger: [
    { id: "price-change", label: "Price Change", icon: TrendingUp },
    { id: "time-interval", label: "Time Interval", icon: Zap },
    { id: "apy-threshold", label: "APY Threshold", icon: TrendingUp },
  ],
  condition: [
    { id: "risk-check", label: "Risk Check", icon: Shield },
    { id: "balance-check", label: "Balance Check", icon: CheckCircle },
    { id: "gas-check", label: "Gas Price Check", icon: Zap },
  ],
  action: [
    { id: "deposit", label: "Deposit to Pool", icon: Plus },
    { id: "withdraw", label: "Withdraw from Pool", icon: Trash2 },
    { id: "swap", label: "Swap Tokens", icon: ArrowRight },
    { id: "rebalance", label: "Rebalance Portfolio", icon: TrendingUp },
  ],
};

export function StrategyFlowBuilder({
  onSave,
  onDeploy,
  initialFlow,
}: StrategyFlowBuilderProps) {
  const [flow, setFlow] = useState<StrategyFlow>(
    initialFlow || {
      id: `flow-${Date.now()}`,
      name: "New Strategy",
      nodes: [],
      isActive: false,
    }
  );

  const [selectedNodeType, setSelectedNodeType] = useState<string>("trigger");
  const [isDeploying, setIsDeploying] = useState(false);

  const addNode = (template: { id: string; label: string }) => {
    const newNode: StrategyNode = {
      id: `node-${Date.now()}`,
      type: selectedNodeType as any,
      label: template.label,
      config: {},
    };

    setFlow({
      ...flow,
      nodes: [...flow.nodes, newNode],
    });
  };

  const removeNode = (nodeId: string) => {
    setFlow({
      ...flow,
      nodes: flow.nodes.filter((n) => n.id !== nodeId),
    });
  };

  const updateNodeConfig = (nodeId: string, config: Record<string, any>) => {
    setFlow({
      ...flow,
      nodes: flow.nodes.map((n) => (n.id === nodeId ? { ...n, config } : n)),
    });
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      await onDeploy(flow);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      {/* Left Panel - Node Library */}
      <div className="col-span-3 space-y-4">
        <Card className="border-border-dark bg-card-dark">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Strategy Nodes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Node Type</Label>
              <Select value={selectedNodeType} onValueChange={setSelectedNodeType}>
                <SelectTrigger className="bg-background-dark border-border-dark">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trigger">Triggers</SelectItem>
                  <SelectItem value="condition">Conditions</SelectItem>
                  <SelectItem value="action">Actions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              {NODE_TEMPLATES[selectedNodeType as keyof typeof NODE_TEMPLATES]?.map(
                (template) => {
                  const Icon = template.icon;
                  return (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      onClick={() => addNode(template)}
                      className="w-full justify-start gap-2 bg-background-dark border-border-dark hover:border-mantle-teal/50"
                    >
                      <Icon className="size-4" />
                      <span className="text-xs">{template.label}</span>
                    </Button>
                  );
                }
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border-dark bg-card-dark">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Strategy Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Strategy Name</Label>
              <Input
                value={flow.name}
                onChange={(e) => setFlow({ ...flow, name: e.target.value })}
                className="bg-background-dark border-border-dark text-sm"
                placeholder="My Strategy"
              />
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={flow.isActive ? "default" : "outline"} className="text-xs">
                {flow.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {flow.nodes.length} nodes
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Center Panel - Flow Canvas */}
      <div className="col-span-6">
        <Card className="border-border-dark bg-card-dark h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold">Strategy Flow</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSave(flow)}
                  className="text-xs"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  onClick={handleDeploy}
                  disabled={isDeploying || flow.nodes.length === 0}
                  className="bg-mantle-teal hover:bg-mantle-teal/90 text-xs"
                >
                  {isDeploying ? (
                    <>Deploying...</>
                  ) : (
                    <>
                      <Play className="size-3 mr-1" />
                      Deploy Strategy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[calc(100%-80px)] overflow-auto">
            {flow.nodes.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="size-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No nodes added yet</p>
                  <p className="text-xs mt-1">Add nodes from the left panel to build your strategy</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {flow.nodes.map((node, idx) => (
                  <div key={node.id}>
                    <StrategyNodeCard
                      node={node}
                      onRemove={() => removeNode(node.id)}
                      onConfigChange={(config) => updateNodeConfig(node.id, config)}
                    />
                    {idx < flow.nodes.length - 1 && (
                      <div className="flex justify-center my-2">
                        <ArrowRight className="size-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Configuration */}
      <div className="col-span-3 space-y-4">
        <Card className="border-border-dark bg-card-dark">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Risk Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Max Slippage: 1%
              </Label>
              <Slider defaultValue={[1]} max={5} step={0.1} className="mb-2" />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Max Gas Price: 50 gwei
              </Label>
              <Slider defaultValue={[50]} max={200} step={10} className="mb-2" />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Rebalance Threshold: 5%
              </Label>
              <Slider defaultValue={[5]} max={20} step={1} className="mb-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border-dark bg-card-dark">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Execution Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Check Interval</Label>
              <Select defaultValue="1h">
                <SelectTrigger className="bg-background-dark border-border-dark text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15m">Every 15 minutes</SelectItem>
                  <SelectItem value="1h">Every hour</SelectItem>
                  <SelectItem value="6h">Every 6 hours</SelectItem>
                  <SelectItem value="24h">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Auto-Execute</Label>
              <Select defaultValue="manual">
                <SelectTrigger className="bg-background-dark border-border-dark text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Approval</SelectItem>
                  <SelectItem value="auto">Fully Automated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StrategyNodeCard({
  node,
  onRemove,
  onConfigChange,
}: {
  node: StrategyNode;
  onRemove: () => void;
  onConfigChange: (config: Record<string, any>) => void;
}) {
  const typeColors = {
    trigger: "border-blue-500/30 bg-blue-500/5",
    condition: "border-yellow-500/30 bg-yellow-500/5",
    action: "border-green-500/30 bg-green-500/5",
    rebalance: "border-purple-500/30 bg-purple-500/5",
  };

  const typeIcons = {
    trigger: Zap,
    condition: Shield,
    action: TrendingUp,
    rebalance: ArrowRight,
  };

  const Icon = typeIcons[node.type];

  return (
    <div className={`border-2 rounded-lg p-3 ${typeColors[node.type]}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="bg-background-dark rounded p-1.5">
            <Icon className="size-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{node.label}</div>
            <div className="text-xs text-muted-foreground capitalize">{node.type}</div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-6 w-6 p-0 hover:bg-red-500/10 hover:text-red-500"
        >
          <Trash2 className="size-3" />
        </Button>
      </div>

      {/* Node-specific configuration */}
      <div className="space-y-2 mt-3">
        {node.type === "trigger" && node.label.includes("APY") && (
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Minimum APY %</Label>
            <Input
              type="number"
              placeholder="5.0"
              className="bg-background-dark border-border-dark text-xs h-8"
              onChange={(e) => onConfigChange({ ...node.config, minAPY: e.target.value })}
            />
          </div>
        )}

        {node.type === "action" && node.label.includes("Deposit") && (
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Amount %</Label>
            <Input
              type="number"
              placeholder="50"
              className="bg-background-dark border-border-dark text-xs h-8"
              onChange={(e) => onConfigChange({ ...node.config, amount: e.target.value })}
            />
          </div>
        )}

        {node.type === "condition" && node.label.includes("Risk") && (
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Max Risk Score</Label>
            <Input
              type="number"
              placeholder="60"
              className="bg-background-dark border-border-dark text-xs h-8"
              onChange={(e) => onConfigChange({ ...node.config, maxRisk: e.target.value })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
