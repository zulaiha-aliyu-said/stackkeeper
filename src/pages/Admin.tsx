import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Shield,
  Copy,
  Plus,
  Filter,
  Loader2,
  ShieldAlert,
  Download,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Users,
  Crown,
  Activity,
  Pencil,
  UserCheck,
  UserPlus,
  LogIn,
  VenetianMask,
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
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

interface AdminUser {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  tier: string | null;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  is_admin: boolean;
}

interface ActivityStats {
  registrations: { d1: number; d7: number; d30: number; total: number };
  logins: { d1: number; d7: number; d30: number };
  users: { total: number; ltd: number; starter: number; pro: number; agency: number };
  daily: Array<{ day: string; registrations: number; logins: number }>;
}

const CODE_BATCH_SIZE = 100;
const MAX_CODE_QUANTITY = 1000;

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

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function formatShortDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function isActiveRecently(user: AdminUser, days = 30) {
  if (!user.last_sign_in_at) return false;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return new Date(user.last_sign_in_at).getTime() >= cutoff;
}

export default function Admin() {
  const { user, impersonateUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [codes, setCodes] = useState<RedemptionCode[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [impersonating, setImpersonating] = useState(false);
  const [impersonateTarget, setImpersonateTarget] = useState<AdminUser | null>(null);

  // Generation form
  const [selectedTier, setSelectedTier] = useState<UserTier>('starter');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // Code filters
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // User filters
  const [userSearch, setUserSearch] = useState('');
  const [ltdSearch, setLtdSearch] = useState('');
  const [recentLimit, setRecentLimit] = useState<5 | 10>(10);

  // Last generated batch
  const [lastGenerated, setLastGenerated] = useState<string[]>([]);

  // Edit dialog
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editTier, setEditTier] = useState<string>('none');

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

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    const { data, error } = await supabase.rpc('admin_list_users' as any);
    if (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users: ' + error.message);
    } else {
      setUsers((data as AdminUser[]) || []);
    }
    setUsersLoading(false);
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    const { data, error } = await supabase.rpc('admin_activity_stats' as any);
    if (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load activity stats: ' + error.message);
    } else {
      setStats(data as ActivityStats);
    }
    setStatsLoading(false);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetchCodes();
    fetchUsers();
    fetchStats();
  }, [isAdmin, fetchCodes, fetchUsers, fetchStats]);

  const handleGenerateCodes = async () => {
    if (!user) return;
    setGenerating(true);

    const uniqueCodes = new Set<string>();
    while (uniqueCodes.size < quantity) {
      uniqueCodes.add(generateCode(selectedTier));
    }

    const newCodes = Array.from(uniqueCodes).map((code) => ({
      code,
      tier: selectedTier,
      created_by: user.id,
      notes: notes || null,
    }));

    let inserted = 0;
    try {
      for (let i = 0; i < newCodes.length; i += CODE_BATCH_SIZE) {
        const batch = newCodes.slice(i, i + CODE_BATCH_SIZE);
        const { error } = await supabase.from('redemption_codes' as any).insert(batch as any);
        if (error) throw error;
        inserted += batch.length;
      }
      toast.success(`Generated ${inserted} ${selectedTier} code(s)`);
      setLastGenerated(newCodes.map((c) => c.code));
      setNotes('');
      fetchCodes();
    } catch (err: any) {
      toast.error(`Failed after ${inserted} codes: ${err.message || 'Unknown error'}`);
      if (inserted > 0) {
        setLastGenerated(newCodes.slice(0, inserted).map((c) => c.code));
        fetchCodes();
      }
    }

    setGenerating(false);
  };

  const openEditUser = (u: AdminUser) => {
    setEditingUser(u);
    setEditFullName(u.full_name || '');
    setEditTier(u.tier || 'none');
  };

  const confirmImpersonate = (u: AdminUser) => {
    if (u.is_admin) {
      toast.error('Cannot impersonate another admin');
      return;
    }
    if (u.id === user?.id) {
      toast.error('Cannot impersonate yourself');
      return;
    }
    setImpersonateTarget(u);
  };

  const handleImpersonate = async () => {
    if (!impersonateTarget) return;
    setImpersonating(true);
    try {
      await impersonateUser(impersonateTarget.id);
      setImpersonateTarget(null);
      setEditingUser(null);
    } catch {
      // toast handled in AuthContext
    } finally {
      setImpersonating(false);
    }
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setSavingUser(true);

    const clearTier = editTier === 'none';
    const { error } = await supabase.rpc('admin_update_user' as any, {
      _user_id: editingUser.id,
      _full_name: editFullName.trim() || null,
      _tier: clearTier ? null : editTier,
      _clear_tier: clearTier,
    });

    if (error) {
      toast.error('Failed to update user: ' + error.message);
    } else {
      toast.success('User updated');
      setEditingUser(null);
      fetchUsers();
      fetchStats();
    }
    setSavingUser(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const copyCodes = (list: string[], label: string) => {
    navigator.clipboard.writeText(list.join('\n'));
    toast.success(`Copied ${list.length} ${label}`);
  };

  const downloadCodes = (list: { code: string; tier: string }[], filename: string, format: 'txt' | 'csv') => {
    let content = '';
    let mime = 'text/plain';
    if (format === 'csv') {
      content = 'code,tier\n' + list.map((c) => `${c.code},${c.tier}`).join('\n');
      mime = 'text/csv';
    } else {
      content = list.map((c) => c.code).join('\n');
    }
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${list.length} codes`);
  };

  const downloadExcel = (list: Array<Record<string, any>>, filename: string, sheetName = 'Codes') => {
    const ws = XLSX.utils.json_to_sheet(list);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
    toast.success(`Downloaded ${list.length} rows as Excel`);
  };

  const filteredCodes = codes.filter((c) => {
    if (filterTier !== 'all' && c.tier !== filterTier) return false;
    if (filterStatus === 'available' && c.is_redeemed) return false;
    if (filterStatus === 'redeemed' && !c.is_redeemed) return false;
    return true;
  });

  const activeUsers = useMemo(
    () => users.filter((u) => isActiveRecently(u, 30) || !!u.email_confirmed_at),
    [users]
  );

  const ltdUsers = useMemo(() => users.filter((u) => !!u.tier), [users]);

  const filterUsers = (list: AdminUser[], search: string) => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.full_name?.toLowerCase().includes(q) ||
        u.tier?.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
    );
  };

  const chartData = useMemo(() => {
    if (!stats?.daily) return [];
    return stats.daily.map((d) => ({
      day: new Date(d.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      registrations: d.registrations,
      logins: d.logins,
    }));
  }, [stats]);

  const recentRegistrations = useMemo(
    () =>
      [...users]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, recentLimit),
    [users, recentLimit]
  );

  const recentLogins = useMemo(
    () =>
      [...users]
        .filter((u) => !!u.last_sign_in_at)
        .sort(
          (a, b) =>
            new Date(b.last_sign_in_at!).getTime() - new Date(a.last_sign_in_at!).getTime()
        )
        .slice(0, recentLimit),
    [users, recentLimit]
  );

  const copyAllVisible = () => copyCodes(filteredCodes.map((c) => c.code), 'codes');

  const downloadVisible = (format: 'txt' | 'csv') => {
    const ts = new Date().toISOString().slice(0, 10);
    downloadCodes(filteredCodes, `redemption-codes-${ts}.${format}`, format);
  };

  const downloadVisibleExcel = () => {
    const ts = new Date().toISOString().slice(0, 10);
    downloadExcel(
      filteredCodes.map((c) => ({
        Code: c.code,
        Tier: c.tier,
        Status: c.is_redeemed ? 'Redeemed' : 'Available',
        'Redeemed By': c.redeemed_by || '',
        'Redeemed At': c.redeemed_at ? new Date(c.redeemed_at).toLocaleString() : '',
        Created: new Date(c.created_at).toLocaleString(),
        Notes: c.notes || '',
      })),
      `redemption-codes-${ts}.xlsx`
    );
  };

  const exportUsersExcel = (list: AdminUser[], filename: string) => {
    downloadExcel(
      list.map((u) => ({
        Email: u.email || '',
        Name: u.full_name || '',
        Tier: u.tier || 'Free',
        Admin: u.is_admin ? 'Yes' : 'No',
        Registered: formatDate(u.created_at),
        'Last Login': formatDate(u.last_sign_in_at),
        Confirmed: u.email_confirmed_at ? 'Yes' : 'No',
        'User ID': u.id,
      })),
      filename,
      'Users'
    );
  };

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

  const renderUserTable = (list: AdminUser[], emptyMessage: string) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead>Registered</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            list.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="space-y-0.5">
                    <p className="font-medium">{u.full_name || 'Unnamed'}</p>
                    <p className="text-sm text-muted-foreground">{u.email || '—'}</p>
                    <p className="text-xs text-muted-foreground font-mono">{u.id.slice(0, 8)}…</p>
                  </div>
                </TableCell>
                <TableCell>
                  {u.tier ? (
                    <Badge variant={u.tier === 'agency' ? 'default' : u.tier === 'pro' ? 'secondary' : 'outline'}>
                      {u.tier}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Free</Badge>
                  )}
                  {u.is_admin && (
                    <Badge className="ml-2" variant="destructive">
                      Admin
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatShortDate(u.created_at)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(u.last_sign_in_at)}</TableCell>
                <TableCell>
                  {isActiveRecently(u, 7) ? (
                    <Badge className="text-green-500 border-green-500" variant="outline">
                      Active (7d)
                    </Badge>
                  ) : isActiveRecently(u, 30) ? (
                    <Badge variant="secondary">Active (30d)</Badge>
                  ) : (
                    <Badge variant="outline">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {!u.is_admin && u.id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Impersonate user"
                        onClick={() => confirmImpersonate(u)}
                      >
                        <VenetianMask className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" title="Edit user" onClick={() => openEditUser(u)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              Admin Panel
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage users, LTD plans, activity, and redemption codes
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              fetchUsers();
              fetchStats();
              fetchCodes();
            }}
          >
            <Activity className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex h-auto flex-wrap gap-1">
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users ({activeUsers.length})
            </TabsTrigger>
            <TabsTrigger value="ltd" className="gap-2">
              <Crown className="h-4 w-4" />
              LTD ({ltdUsers.length})
            </TabsTrigger>
            <TabsTrigger value="codes" className="gap-2">
              <Plus className="h-4 w-4" />
              Codes
            </TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            {statsLoading && !stats ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Total Users
                      </CardDescription>
                      <CardTitle className="text-3xl">{stats?.users.total ?? users.length}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      {stats?.users.ltd ?? ltdUsers.length} on LTD plans
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Registrations
                      </CardDescription>
                      <CardTitle className="text-3xl">{stats?.registrations.d30 ?? 0}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      30d · {stats?.registrations.d7 ?? 0} (7d) · {stats?.registrations.d1 ?? 0} (1d)
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <LogIn className="h-4 w-4" />
                        Logins
                      </CardDescription>
                      <CardTitle className="text-3xl">{stats?.logins.d30 ?? 0}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      30d · {stats?.logins.d7 ?? 0} (7d) · {stats?.logins.d1 ?? 0} (1d)
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Active (30d)
                      </CardDescription>
                      <CardTitle className="text-3xl">
                        {users.filter((u) => isActiveRecently(u, 30)).length}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      Signed in within the last 30 days
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Registration window</CardTitle>
                      <CardDescription>New accounts by period</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-3">
                      {[
                        { label: '1 day', value: stats?.registrations.d1 ?? 0 },
                        { label: '7 days', value: stats?.registrations.d7 ?? 0 },
                        { label: '30 days', value: stats?.registrations.d30 ?? 0 },
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg border p-3 text-center">
                          <p className="text-2xl font-bold">{item.value}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Login window</CardTitle>
                      <CardDescription>Users who signed in by period</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-3">
                      {[
                        { label: '1 day', value: stats?.logins.d1 ?? 0 },
                        { label: '7 days', value: stats?.logins.d7 ?? 0 },
                        { label: '30 days', value: stats?.logins.d30 ?? 0 },
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg border p-3 text-center">
                          <p className="text-2xl font-bold">{item.value}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <CardTitle>Recent users</CardTitle>
                        <CardDescription>
                          Latest registrations and most recent logins
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant={recentLimit === 5 ? 'default' : 'outline'}
                          className="h-8 px-3"
                          onClick={() => setRecentLimit(5)}
                        >
                          Last 5
                        </Button>
                        <Button
                          size="sm"
                          variant={recentLimit === 10 ? 'default' : 'outline'}
                          className="h-8 px-3"
                          onClick={() => setRecentLimit(10)}
                        >
                          Last 10
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <UserPlus className="h-4 w-4 text-primary" />
                          Recent registrations
                        </div>
                        <div className="rounded-md border divide-y">
                          {recentRegistrations.length === 0 ? (
                            <p className="p-4 text-sm text-muted-foreground text-center">
                              No registrations yet.
                            </p>
                          ) : (
                            recentRegistrations.map((u) => (
                              <div
                                key={`reg-${u.id}`}
                                className="flex items-start justify-between gap-3 p-3"
                              >
                                <div className="min-w-0 space-y-0.5">
                                  <p className="font-medium truncate">
                                    {u.full_name || 'Unnamed'}
                                  </p>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {u.email || '—'}
                                  </p>
                                  <div className="flex flex-wrap gap-1 pt-1">
                                    {u.tier ? (
                                      <Badge
                                        variant={
                                          u.tier === 'agency'
                                            ? 'default'
                                            : u.tier === 'pro'
                                              ? 'secondary'
                                              : 'outline'
                                        }
                                      >
                                        {u.tier}
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline">Free</Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right shrink-0 space-y-1">
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(u.created_at)}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => openEditUser(u)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <LogIn className="h-4 w-4 text-primary" />
                          Recent logins
                        </div>
                        <div className="rounded-md border divide-y">
                          {recentLogins.length === 0 ? (
                            <p className="p-4 text-sm text-muted-foreground text-center">
                              No logins recorded yet.
                            </p>
                          ) : (
                            recentLogins.map((u) => (
                              <div
                                key={`login-${u.id}`}
                                className="flex items-start justify-between gap-3 p-3"
                              >
                                <div className="min-w-0 space-y-0.5">
                                  <p className="font-medium truncate">
                                    {u.full_name || 'Unnamed'}
                                  </p>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {u.email || '—'}
                                  </p>
                                  <div className="flex flex-wrap gap-1 pt-1">
                                    {u.tier ? (
                                      <Badge
                                        variant={
                                          u.tier === 'agency'
                                            ? 'default'
                                            : u.tier === 'pro'
                                              ? 'secondary'
                                              : 'outline'
                                        }
                                      >
                                        {u.tier}
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline">Free</Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right shrink-0 space-y-1">
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(u.last_sign_in_at)}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => openEditUser(u)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Activity (last 30 days)</CardTitle>
                    <CardDescription>Daily registrations and logins</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[320px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="regFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="loginFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 20%)" />
                          <XAxis
                            dataKey="day"
                            tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            minTickGap={24}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(222, 47%, 9%)',
                              border: '1px solid hsl(217, 33%, 20%)',
                              borderRadius: '8px',
                              color: 'hsl(210, 40%, 98%)',
                            }}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="registrations"
                            name="Registrations"
                            stroke="hsl(217, 91%, 60%)"
                            fill="url(#regFill)"
                            strokeWidth={2}
                          />
                          <Area
                            type="monotone"
                            dataKey="logins"
                            name="Logins"
                            stroke="hsl(142, 71%, 45%)"
                            fill="url(#loginFill)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>LTD plan breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Starter', value: stats?.users.starter ?? 0 },
                      { label: 'Pro', value: stats?.users.pro ?? 0 },
                      { label: 'Agency', value: stats?.users.agency ?? 0 },
                      { label: 'Free', value: (stats?.users.total ?? 0) - (stats?.users.ltd ?? 0) },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border p-4 text-center">
                        <p className="text-2xl font-bold">{item.value}</p>
                        <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Active Users */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>
                      View and edit user details. Active badges use last login in 7/30 days.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      placeholder="Search name, email, tier…"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-[220px]"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() =>
                        exportUsersExcel(
                          filterUsers(users, userSearch),
                          `users-${new Date().toISOString().slice(0, 10)}.xlsx`
                        )
                      }
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  renderUserTable(filterUsers(users, userSearch), 'No users found.')
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* LTD Users */}
          <TabsContent value="ltd" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Active LTD Users</CardTitle>
                    <CardDescription>
                      Users with an active Starter, Pro, or Agency plan
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      placeholder="Search LTD users…"
                      value={ltdSearch}
                      onChange={(e) => setLtdSearch(e.target.value)}
                      className="w-[220px]"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() =>
                        exportUsersExcel(
                          filterUsers(ltdUsers, ltdSearch),
                          `ltd-users-${new Date().toISOString().slice(0, 10)}.xlsx`
                        )
                      }
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  renderUserTable(filterUsers(ltdUsers, ltdSearch), 'No LTD users yet.')
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Codes */}
          <TabsContent value="codes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Generate Codes
                </CardTitle>
                <CardDescription>
                  Create up to {MAX_CODE_QUANTITY} redemption codes at once (inserted in batches of{' '}
                  {CODE_BATCH_SIZE})
                </CardDescription>
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
                    <Label>Quantity (1–{MAX_CODE_QUANTITY})</Label>
                    <Input
                      type="number"
                      min={1}
                      max={MAX_CODE_QUANTITY}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(
                          Math.min(MAX_CODE_QUANTITY, Math.max(1, parseInt(e.target.value) || 1))
                        )
                      }
                    />
                    <div className="flex flex-wrap gap-1">
                      {[10, 50, 100, 500, 1000].map((n) => (
                        <Button
                          key={n}
                          type="button"
                          size="sm"
                          variant={quantity === n ? 'default' : 'outline'}
                          className="h-7 px-2 text-xs"
                          onClick={() => setQuantity(n)}
                        >
                          {n}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Textarea
                      placeholder="e.g. LTD batch #1"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="h-10 min-h-[40px]"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleGenerateCodes} disabled={generating} className="w-full gap-2">
                      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Generate {quantity}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {lastGenerated.length > 0 && (
              <Card className="border-primary/40 bg-primary/5">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        Last Generated Batch ({lastGenerated.length})
                      </CardTitle>
                      <CardDescription>Copy or download the codes you just created</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setLastGenerated([])}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    readOnly
                    value={lastGenerated.join('\n')}
                    className="font-mono text-sm h-auto min-h-[80px]"
                    rows={Math.min(lastGenerated.length, 8)}
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => copyCodes(lastGenerated, 'codes')} className="gap-2">
                      <Copy className="h-4 w-4" />
                      Copy All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const ts = new Date().toISOString().slice(0, 10);
                        downloadCodes(
                          lastGenerated.map((code) => ({ code, tier: selectedTier })),
                          `codes-batch-${ts}.txt`,
                          'txt'
                        );
                      }}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download .txt
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const ts = new Date().toISOString().slice(0, 10);
                        downloadCodes(
                          lastGenerated.map((code) => ({ code, tier: selectedTier })),
                          `codes-batch-${ts}.csv`,
                          'csv'
                        );
                      }}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download .csv
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const ts = new Date().toISOString().slice(0, 10);
                        downloadExcel(
                          lastGenerated.map((code) => ({ Code: code, Tier: selectedTier })),
                          `codes-batch-${ts}.xlsx`
                        );
                      }}
                      className="gap-2"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      Download .xlsx
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle>All Codes ({filteredCodes.length})</CardTitle>
                    <CardDescription>
                      {codes.filter((c) => !c.is_redeemed).length} available,{' '}
                      {codes.filter((c) => c.is_redeemed).length} redeemed
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
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
                    <Button variant="outline" size="sm" onClick={() => downloadVisible('txt')} className="gap-2">
                      <Download className="h-4 w-4" />
                      .txt
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => downloadVisible('csv')} className="gap-2">
                      <Download className="h-4 w-4" />
                      .csv
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadVisibleExcel} className="gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      .xlsx
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border max-h-[560px] overflow-auto">
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
                              <Badge
                                variant={
                                  c.tier === 'agency' ? 'default' : c.tier === 'pro' ? 'secondary' : 'outline'
                                }
                              >
                                {c.tier}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={c.is_redeemed ? 'destructive' : 'outline'}
                                className={!c.is_redeemed ? 'text-green-500 border-green-500' : ''}
                              >
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
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update display name and LTD plan for {editingUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={editingUser?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Plan tier</Label>
              <Select value={editTier} onValueChange={setEditTier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Free (no LTD)</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="agency">Agency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-md border p-3 text-sm text-muted-foreground space-y-1">
              <p>Registered: {formatDate(editingUser?.created_at)}</p>
              <p>Last login: {formatDate(editingUser?.last_sign_in_at)}</p>
              <p className="font-mono text-xs">ID: {editingUser?.id}</p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
            <div>
              {editingUser && !editingUser.is_admin && editingUser.id !== user?.id && (
                <Button
                  variant="secondary"
                  className="gap-2 w-full sm:w-auto"
                  onClick={() => confirmImpersonate(editingUser)}
                >
                  <VenetianMask className="h-4 w-4" />
                  Impersonate
                </Button>
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => setEditingUser(null)} className="flex-1 sm:flex-none">
                Cancel
              </Button>
              <Button onClick={handleSaveUser} disabled={savingUser} className="gap-2 flex-1 sm:flex-none">
                {savingUser && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!impersonateTarget}
        onOpenChange={(open) => !open && !impersonating && setImpersonateTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Impersonate user?</AlertDialogTitle>
            <AlertDialogDescription>
              You will sign in as{' '}
              <span className="font-medium text-foreground">
                {impersonateTarget?.full_name || impersonateTarget?.email}
              </span>
              {impersonateTarget?.email ? ` (${impersonateTarget.email})` : ''}. Your admin session
              is saved so you can exit anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={impersonating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={impersonating}
              className="gap-2"
              onClick={(e) => {
                e.preventDefault();
                handleImpersonate();
              }}
            >
              {impersonating && <Loader2 className="h-4 w-4 animate-spin" />}
              Impersonate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
