import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Copy, Plus, Filter, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import type { UserTier } from '@/types/team';

interface RedemptionCode {
  id: string;
  code: string;
  tier: string;
  is_redeemed: boolean;
  redeemed_by: string | null;
  redeemed_at: string | null;
  created_at: string;
  notes: string | null;
}

function generateCode(tier: UserTier): string {
  const prefixes: Record<UserTier, string> = {
    starter: 'STR',
    pro: 'PRO',
    agency: 'AGY',
  };
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let random = '';
  for (let i = 0; i < 8; i++) {
    random += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SV-${prefixes[tier]}-${random}`;
}

export default function Admin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [codes, setCodes] = useState<RedemptionCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Generation form
  const [selectedTier, setSelectedTier] = useState<UserTier>('starter');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // Filter
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Check admin role
  useEffect(() => {
    if (!user) return;
    const checkAdmin = async () => {
      const { data, error } = await supabase
        .from('user_roles' as any)
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin');

      if (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin((data as any[])?.length > 0);
      }
      setLoading(false);
    };
    checkAdmin();
  }, [user]);

  const fetchCodes = useCallback(async () => {
    const { data, error } = await supabase
      .from('redemption_codes' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching codes:', error);
      return;
    }
    setCodes((data as any[]) || []);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchCodes();
  }, [isAdmin, fetchCodes]);

  const handleGenerateCodes = async () => {
    if (!user) return;
    setGenerating(true);

    const newCodes = Array.from({ length: quantity }, () => ({
      code: generateCode(selectedTier),
      tier: selectedTier,
      created_by: user.id,
      notes: notes || null,
    }));

    const { error } = await supabase
      .from('redemption_codes' as any)
      .insert(newCodes as any);

    if (error) {
      toast.error('Failed to generate codes: ' + error.message);
    } else {
      toast.success(`Generated ${quantity} ${selectedTier} code(s)`);
      setNotes('');
      fetchCodes();
    }
    setGenerating(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const copyAllVisible = () => {
    const visible = filteredCodes.map(c => c.code).join('\n');
    navigator.clipboard.writeText(visible);
    toast.success(`Copied ${filteredCodes.length} codes`);
  };

  const filteredCodes = codes.filter(c => {
    if (filterTier !== 'all' && c.tier !== filterTier) return false;
    if (filterStatus === 'available' && c.is_redeemed) return false;
    if (filterStatus === 'redeemed' && !c.is_redeemed) return false;
    return true;
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1">Generate and manage LTD redemption codes</p>
        </div>

        {/* Generate Codes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Generate Codes
            </CardTitle>
            <CardDescription>Create new redemption codes for LTD plans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Plan Tier</Label>
                <Select value={selectedTier} onValueChange={(v) => setSelectedTier(v as UserTier)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter ($49)</SelectItem>
                    <SelectItem value="pro">Pro ($99)</SelectItem>
                    <SelectItem value="agency">Agency ($149)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="e.g. Summer Batch #1"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-10 min-h-[40px]"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleGenerateCodes} disabled={generating} className="w-full gap-2">
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Generate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Codes Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Codes ({filteredCodes.length})</CardTitle>
                <CardDescription>
                  {codes.filter(c => !c.is_redeemed).length} available, {codes.filter(c => c.is_redeemed).length} redeemed
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={filterTier} onValueChange={setFilterTier}>
                  <SelectTrigger className="w-[130px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="redeemed">Redeemed</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={copyAllVisible} className="gap-2">
                  <Copy className="h-4 w-4" />
                  Copy All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Redeemed By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCodes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No codes found. Generate some above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCodes.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono font-semibold">{c.code}</TableCell>
                        <TableCell>
                          <Badge variant={c.tier === 'agency' ? 'default' : c.tier === 'pro' ? 'secondary' : 'outline'}>
                            {c.tier}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={c.is_redeemed ? 'destructive' : 'outline'} className={!c.is_redeemed ? 'text-green-500 border-green-500' : ''}>
                            {c.is_redeemed ? 'Redeemed' : 'Available'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {c.redeemed_by ? c.redeemed_by.slice(0, 8) + '...' : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(c.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[150px] truncate">
                          {c.notes || '—'}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => copyCode(c.code)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
