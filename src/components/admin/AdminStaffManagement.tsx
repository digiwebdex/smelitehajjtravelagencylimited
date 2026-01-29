import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Shield, 
  Activity,
  Search,
  UserCheck,
  UserX,
  Clock,
  Filter
} from "lucide-react";

interface StaffMember {
  id: string;
  user_id: string;
  role: 'admin' | 'manager' | 'agent' | 'support';
  employee_id: string | null;
  department: string | null;
  phone: string | null;
  address: string | null;
  hire_date: string | null;
  is_active: boolean;
  permissions: Record<string, boolean>;
  created_at: string;
  updated_at: string;
  staff_name: string | null;
  mobile_number: string | null;
  profile?: {
    full_name: string | null;
    email: string | null;
  };
}

interface RegisteredUser {
  id: string;
  email: string | null;
  full_name: string | null;
}

interface ActivityLog {
  id: string;
  staff_id: string | null;
  user_id: string | null;
  action_type: string;
  action_description: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
  staff_member?: {
    profile?: {
      full_name: string | null;
    };
  };
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  manager: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  agent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  support: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const DEFAULT_PERMISSIONS = {
  manage_bookings: false,
  manage_packages: false,
  manage_content: false,
  view_reports: false,
  manage_customers: false,
  manage_payments: false,
};

const AdminStaffManagement = () => {
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [activityFilter, setActivityFilter] = useState<string>("all");

  const [createNewUser, setCreateNewUser] = useState(true);
  const [formData, setFormData] = useState({
    user_id: "",
    email: "",
    password: "",
    staff_name: "",
    mobile_number: "",
    role: "support" as 'admin' | 'manager' | 'agent' | 'support',
    employee_id: "",
    department: "",
    phone: "",
    address: "",
    is_active: true,
    permissions: { ...DEFAULT_PERMISSIONS },
  });

  useEffect(() => {
    fetchStaff();
    fetchActivityLogs();
    fetchRegisteredUsers();
  }, []);

  const fetchStaff = async () => {
    try {
      // First fetch staff members
      const { data: staffData, error: staffError } = await supabase
        .from("staff_members")
        .select("*")
        .order("created_at", { ascending: false });

      if (staffError) throw staffError;

      // Then fetch profiles for each staff member
      if (staffData && staffData.length > 0) {
        const userIds = staffData.map(s => s.user_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        // Map profiles to staff members
        const staffWithProfiles = staffData.map(staff => ({
          ...staff,
          profile: profilesData?.find(p => p.id === staff.user_id) || null
        }));

        setStaff(staffWithProfiles as unknown as StaffMember[]);
      } else {
        setStaff([]);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("staff_activity_log")
        .select(`
          *,
          staff_member:staff_members(
            profile:profiles!staff_members_user_id_fkey(full_name)
          )
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setActivityLogs((data as unknown as ActivityLog[]) || []);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    }
  };

  const fetchRegisteredUsers = async () => {
    try {
      // Fetch all profiles and filter out those already staff
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .order("full_name", { ascending: true });

      if (error) throw error;
      setRegisteredUsers(profiles || []);
    } catch (error) {
      console.error("Error fetching registered users:", error);
    }
  };

  // Get available users (not already staff)
  const availableUsers = registeredUsers.filter(
    (user) => !staff.some((s) => s.user_id === user.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingStaff) {
        // Update existing staff
        const { error } = await supabase
          .from("staff_members")
          .update({
            staff_name: formData.staff_name || null,
            mobile_number: formData.mobile_number || null,
            role: formData.role,
            employee_id: formData.employee_id || null,
            department: formData.department || null,
            phone: formData.phone || null,
            address: formData.address || null,
            is_active: formData.is_active,
            permissions: formData.permissions,
          })
          .eq("id", editingStaff.id);

        if (error) throw error;

        toast({ title: "Success", description: "Staff member updated successfully" });
      } else {
        let userId = formData.user_id;
        let staffName = formData.staff_name;

        if (createNewUser) {
          // Validate new user fields
          if (!formData.email || !formData.password || !formData.staff_name) {
            toast({
              title: "Error",
              description: "Email, password, and name are required for new staff.",
              variant: "destructive",
            });
            return;
          }

          if (formData.password.length < 6) {
            toast({
              title: "Error",
              description: "Password must be at least 6 characters.",
              variant: "destructive",
            });
            return;
          }

          // Create user account via edge function
          const { data: createResult, error: createError } = await supabase.functions.invoke(
            "create-staff-user",
            {
              body: {
                email: formData.email,
                password: formData.password,
                full_name: formData.staff_name,
                phone: formData.mobile_number || undefined,
              },
            }
          );

          if (createError || !createResult?.user_id) {
            toast({
              title: "Error",
              description: createResult?.error || createError?.message || "Failed to create user account",
              variant: "destructive",
            });
            return;
          }

          userId = createResult.user_id;
          staffName = formData.staff_name;
        } else {
          // Validate existing user selection
          if (!formData.user_id) {
            toast({
              title: "Error",
              description: "Please select a registered user.",
              variant: "destructive",
            });
            return;
          }

          const selectedUser = registeredUsers.find(u => u.id === formData.user_id);
          staffName = formData.staff_name || selectedUser?.full_name || null;
        }

        // Create staff member record
        const { error } = await supabase
          .from("staff_members")
          .insert({
            user_id: userId,
            staff_name: staffName,
            mobile_number: formData.mobile_number || null,
            role: formData.role,
            employee_id: formData.employee_id || null,
            department: formData.department || null,
            phone: formData.phone || null,
            address: formData.address || null,
            is_active: formData.is_active,
            permissions: formData.permissions,
          });

        if (error) {
          if (error.code === "23505") {
            toast({
              title: "Error",
              description: "This user is already a staff member.",
              variant: "destructive",
            });
            return;
          }
          throw error;
        }

        toast({ 
          title: "Success", 
          description: createNewUser 
            ? `Staff member created. Login: ${formData.email}` 
            : "Staff member added successfully" 
        });
        fetchRegisteredUsers();
      }

      setIsDialogOpen(false);
      resetForm();
      fetchStaff();
    } catch (error) {
      console.error("Error saving staff:", error);
      toast({
        title: "Error",
        description: "Failed to save staff member",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("staff_members")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Success", description: "Staff member removed successfully" });
      fetchStaff();
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast({
        title: "Error",
        description: "Failed to remove staff member",
        variant: "destructive",
      });
    }
  };

  const toggleStaffStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("staff_members")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Staff member ${currentStatus ? "deactivated" : "activated"} successfully`,
      });
      fetchStaff();
    } catch (error) {
      console.error("Error toggling staff status:", error);
      toast({
        title: "Error",
        description: "Failed to update staff status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: "",
      email: "",
      password: "",
      staff_name: "",
      mobile_number: "",
      role: "support",
      employee_id: "",
      department: "",
      phone: "",
      address: "",
      is_active: true,
      permissions: { ...DEFAULT_PERMISSIONS },
    });
    setEditingStaff(null);
    setCreateNewUser(true);
  };

  const openEditDialog = (staffMember: StaffMember) => {
    setEditingStaff(staffMember);
    setCreateNewUser(false);
    setFormData({
      user_id: staffMember.user_id,
      email: staffMember.profile?.email || "",
      password: "",
      staff_name: staffMember.staff_name || staffMember.profile?.full_name || "",
      mobile_number: staffMember.mobile_number || "",
      role: staffMember.role,
      employee_id: staffMember.employee_id || "",
      department: staffMember.department || "",
      phone: staffMember.phone || "",
      address: staffMember.address || "",
      is_active: staffMember.is_active,
      permissions: { ...DEFAULT_PERMISSIONS, ...staffMember.permissions },
    });
    setIsDialogOpen(true);
  };

  const filteredStaff = staff.filter((s) => {
    const matchesSearch =
      s.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.employee_id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredLogs = activityLogs.filter((log) => {
    if (activityFilter === "all") return true;
    return log.action_type === activityFilter;
  });

  const actionTypes = [...new Set(activityLogs.map((log) => log.action_type))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Staff Management
          </h2>
          <p className="text-muted-foreground">
            Manage staff accounts and monitor activity
          </p>
        </div>
      </div>

      <Tabs defaultValue="staff" className="space-y-4">
        <TabsList>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Staff Members
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Staff Members ({staff.length})</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Staff
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {!editingStaff && (
                      <>
                        {/* Toggle between create new user or select existing */}
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <Label className="text-sm font-medium">Create New User Account</Label>
                            <p className="text-xs text-muted-foreground">
                              {createNewUser 
                                ? "Create a new login account for this staff member" 
                                : "Select from existing registered users"}
                            </p>
                          </div>
                          <Switch
                            checked={createNewUser}
                            onCheckedChange={(checked) => {
                              setCreateNewUser(checked);
                              setFormData({ ...formData, user_id: "", email: "", password: "" });
                            }}
                          />
                        </div>

                        {createNewUser ? (
                          <>
                            {/* New user fields */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="email">Email Address *</Label>
                                <Input
                                  id="email"
                                  type="email"
                                  value={formData.email}
                                  onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                  }
                                  placeholder="staff@example.com"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="password">Password *</Label>
                                <Input
                                  id="password"
                                  type="password"
                                  value={formData.password}
                                  onChange={(e) =>
                                    setFormData({ ...formData, password: e.target.value })
                                  }
                                  placeholder="Min 6 characters"
                                  minLength={6}
                                  required
                                />
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Staff will use these credentials to login at /auth
                            </p>
                          </>
                        ) : (
                          <div className="space-y-2">
                            <Label htmlFor="user_id">Select Registered User *</Label>
                            <Select
                              value={formData.user_id}
                              onValueChange={(value) => {
                                const selectedUser = registeredUsers.find(u => u.id === value);
                                setFormData({ 
                                  ...formData, 
                                  user_id: value,
                                  staff_name: selectedUser?.full_name || ""
                                });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a registered user" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableUsers.length === 0 ? (
                                  <SelectItem value="none" disabled>No available users</SelectItem>
                                ) : (
                                  availableUsers.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.full_name || "No Name"} ({user.email})
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              Only registered users not already staff are shown ({availableUsers.length} available)
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="staff_name">Staff Name *</Label>
                        <Input
                          id="staff_name"
                          value={formData.staff_name}
                          onChange={(e) =>
                            setFormData({ ...formData, staff_name: e.target.value })
                          }
                          placeholder="Full name of staff member"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mobile_number">Mobile Number *</Label>
                        <Input
                          id="mobile_number"
                          value={formData.mobile_number}
                          onChange={(e) =>
                            setFormData({ ...formData, mobile_number: e.target.value })
                          }
                          placeholder="e.g., +880 1XXX XXXXXX"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="role">Role *</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value: 'admin' | 'manager' | 'support') =>
                            setFormData({ ...formData, role: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="support">Support</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="employee_id">Employee ID</Label>
                        <Input
                          id="employee_id"
                          value={formData.employee_id}
                          onChange={(e) =>
                            setFormData({ ...formData, employee_id: e.target.value })
                          }
                          placeholder="e.g., EMP001"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          value={formData.department}
                          onChange={(e) =>
                            setFormData({ ...formData, department: e.target.value })
                          }
                          placeholder="e.g., Sales"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder="Phone number"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        placeholder="Staff address"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Permissions</Label>
                      <div className="grid grid-cols-2 gap-3 p-4 bg-muted/50 rounded-lg">
                        {Object.entries(formData.permissions).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <Label htmlFor={key} className="text-sm font-normal capitalize">
                              {key.replace(/_/g, " ")}
                            </Label>
                            <Switch
                              id={key}
                              checked={value}
                              onCheckedChange={(checked) =>
                                setFormData({
                                  ...formData,
                                  permissions: { ...formData.permissions, [key]: checked },
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="is_active"
                          checked={formData.is_active}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, is_active: checked })
                          }
                        />
                        <Label htmlFor="is_active">Active</Label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingStaff ? "Update" : "Add"} Staff
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or employee ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No staff members found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStaff.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{member.staff_name || member.profile?.full_name || "N/A"}</p>
                              <p className="text-sm text-muted-foreground">
                                {member.profile?.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{member.mobile_number || "-"}</TableCell>
                          <TableCell>
                            <Badge className={ROLE_COLORS[member.role]}>
                              {member.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{member.department || "-"}</TableCell>
                          <TableCell>{member.employee_id || "-"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={member.is_active ? "default" : "secondary"}
                              className="gap-1"
                            >
                              {member.is_active ? (
                                <>
                                  <UserCheck className="h-3 w-3" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <UserX className="h-3 w-3" />
                                  Inactive
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleStaffStatus(member.id, member.is_active)}
                                title={member.is_active ? "Deactivate" : "Activate"}
                              >
                                {member.is_active ? (
                                  <UserX className="h-4 w-4" />
                                ) : (
                                  <UserCheck className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(member)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove Staff Member?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will remove {member.staff_name || member.profile?.full_name} from the staff list.
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(member.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
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

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Select value={activityFilter} onValueChange={setActivityFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {actionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Staff</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Entity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No activity logs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {format(new Date(log.created_at), "MMM dd, yyyy HH:mm")}
                          </TableCell>
                          <TableCell>
                            {log.staff_member?.profile?.full_name || "System"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {log.action_type.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {log.action_description}
                          </TableCell>
                          <TableCell>
                            {log.entity_type && (
                              <span className="text-sm text-muted-foreground">
                                {log.entity_type}
                              </span>
                            )}
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
  );
};

export default AdminStaffManagement;
