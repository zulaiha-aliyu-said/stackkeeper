import { useState } from 'react';
import { useStacks } from '@/hooks/useStacks';
import { useTier } from '@/hooks/useTier';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Layers, Plus, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface StackSelectorProps {
  showLabel?: boolean;
}

export function StackSelector({ showLabel = true }: StackSelectorProps) {
  const { 
    stacks, 
    activeStack, 
    switchStack, 
    createStack, 
    canAddStack, 
    remainingStacks,
    hasMultipleStacks 
  } = useStacks();
  const { tier } = useTier();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newStackName, setNewStackName] = useState('');
  const [newStackDescription, setNewStackDescription] = useState('');

  const handleCreateStack = () => {
    if (!newStackName.trim()) {
      toast.error('Stack name is required');
      return;
    }

    const result = createStack(newStackName.trim(), newStackDescription.trim());
    
    if (result.success) {
      toast.success(`Stack "${newStackName}" created`);
      setNewStackName('');
      setNewStackDescription('');
      setIsCreateModalOpen(false);
    } else {
      toast.error(result.error || 'Failed to create stack');
    }
  };

  if (!hasMultipleStacks) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Layers className="h-4 w-4" />
        <span>{activeStack?.name || 'My Stack'}</span>
        <Badge variant="outline" className="text-xs gap-1">
          <Lock className="h-3 w-3" />
          Agency
        </Badge>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {showLabel && (
          <Label className="text-sm text-muted-foreground flex items-center gap-1">
            <Layers className="h-4 w-4" />
            Stack:
          </Label>
        )}
        <Select value={activeStack?.id} onValueChange={switchStack}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Select stack" />
          </SelectTrigger>
          <SelectContent>
            {stacks.map((stack) => (
              <SelectItem key={stack.id} value={stack.id}>
                <div className="flex items-center gap-2">
                  <span>{stack.name}</span>
                  {stack.isDefault && (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  )}
                </div>
              </SelectItem>
            ))}
            {canAddStack && (
              <div 
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Stack
                <Badge variant="outline" className="ml-auto text-xs">
                  {remainingStacks} left
                </Badge>
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Create New Stack
            </DialogTitle>
            <DialogDescription>
              Create a separate stack for a different project or client.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stackName">Stack Name *</Label>
              <Input
                id="stackName"
                value={newStackName}
                onChange={(e) => setNewStackName(e.target.value)}
                placeholder="e.g., Client Project, Side Hustle"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stackDescription">Description (optional)</Label>
              <Textarea
                id="stackDescription"
                value={newStackDescription}
                onChange={(e) => setNewStackDescription(e.target.value)}
                placeholder="What is this stack for?"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateStack}>
              Create Stack
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
