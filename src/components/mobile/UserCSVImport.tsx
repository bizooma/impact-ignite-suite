import { useState } from 'react';
import { useMobileAppData } from '@/hooks/useMobileAppData';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload, FileCheck, AlertCircle, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { supabase } from '@/integrations/supabase/client';

interface CSVRow {
  full_name: string;
  username: string;
  password: string;
  email?: string;
  phone_number?: string;
  role: string;
  is_active?: string;
  avatar_url?: string;
}

interface ParsedUser extends CSVRow {
  valid: boolean;
  errors: string[];
}

interface UserCSVImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onSuccess: () => void;
}

const VALID_ROLES = [
  'resident',
  'houseParent',
  'clsStaff',
  'successCoach',
  'teacher',
  'caseworker',
  'counselor',
  'staff',
  'admin',
];

export function UserCSVImport({ open, onOpenChange, organizationId, onSuccess }: UserCSVImportProps) {
  const { insertData, fetchTableData } = useMobileAppData(organizationId);
  const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; failed: number } | null>(null);

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Optional field
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateUser = async (user: CSVRow, existingUsernames: Set<string>): Promise<ParsedUser> => {
    const errors: string[] = [];

    if (!user.full_name || user.full_name.trim().length === 0) {
      errors.push('Full name is required');
    }

    if (!user.username || user.username.trim().length < 3) {
      errors.push('Username must be at least 3 characters');
    } else if (existingUsernames.has(user.username.toLowerCase())) {
      errors.push('Username already exists');
    }

    if (!user.password || user.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    if (user.email && !validateEmail(user.email)) {
      errors.push('Invalid email format');
    }

    if (!user.role || !VALID_ROLES.includes(user.role)) {
      errors.push(`Role must be one of: ${VALID_ROLES.join(', ')}`);
    }

    return {
      ...user,
      valid: errors.length === 0,
      errors,
    };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Fetch existing usernames to check for duplicates
    const existingUsersResult = await fetchTableData('users', {
      columns: 'username',
    });
    const existingUsernames = new Set(
      (existingUsersResult.data as any[]).map(u => u.username.toLowerCase())
    );

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const validated = await Promise.all(
          results.data.map(user => validateUser(user, existingUsernames))
        );
        setParsedUsers(validated);
        setImportResults(null);
      },
      error: (error) => {
        toast.error(`Failed to parse CSV: ${error.message}`);
      },
    });
  };

  const handleImport = async () => {
    const validUsers = parsedUsers.filter(u => u.valid);
    
    if (validUsers.length === 0) {
      toast.error('No valid users to import');
      return;
    }

    setImporting(true);
    let successCount = 0;
    let failedCount = 0;

    try {
      for (const user of validUsers) {
        try {
          // Use create_user_with_hash op so the edge function bcrypt-hashes the
          // password server-side and creates a matching Supabase Auth user.
          const { data: result, error } = await supabase.functions.invoke('mobile-app-proxy', {
            body: {
              operation: 'create_user_with_hash',
              table: 'users',
              organizationId,
              data: {
                full_name: user.full_name,
                username: user.username,
                password: user.password,
                email: user.email || null,
                phone_number: user.phone_number || null,
                role: user.role,
                is_active: user.is_active === 'false' ? false : true,
                avatar_url: user.avatar_url || null,
              },
            },
          });

          if (error) throw error;
          if (!result?.success) throw new Error(result?.error || 'Import failed');
          successCount++;
        } catch (error) {
          console.error(`Failed to import user ${user.username}:`, error);
          failedCount++;
        }
      }

      setImportResults({ success: successCount, failed: failedCount });
      
      if (successCount > 0) {
        toast.success(`Imported ${successCount} users successfully`);
        onSuccess();
      }
      
      if (failedCount > 0) {
        toast.error(`Failed to import ${failedCount} users`);
      }
    } finally {
      setImporting(false);
    }
  };

  const validCount = parsedUsers.filter(u => u.valid).length;
  const invalidCount = parsedUsers.filter(u => !u.valid).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Users from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file with user data. Required columns: full_name, username, password, role
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto">
          {/* File Upload */}
          {parsedUsers.length === 0 && (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Upload CSV File</h3>
              <p className="text-sm text-muted-foreground mb-4">
                CSV format: full_name, username, password, email, phone_number, role, is_active, avatar_url
              </p>
              <label htmlFor="csv-upload">
                <Button type="button" asChild>
                  <span className="cursor-pointer">Select CSV File</span>
                </Button>
              </label>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Preview Table */}
          {parsedUsers.length > 0 && !importResults && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge variant="default" className="gap-1">
                    <Check className="h-3 w-3" />
                    {validCount} Valid
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <X className="h-3 w-3" />
                      {invalidCount} Invalid
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => setParsedUsers([])}
                  variant="outline"
                >
                  Clear
                </Button>
              </div>

              <div className="border rounded-lg max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Status</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedUsers.map((user, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {user.valid ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell>{user.full_name}</TableCell>
                        <TableCell className="font-mono text-sm">{user.username}</TableCell>
                        <TableCell>{user.email || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={user.valid ? 'default' : 'destructive'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.errors.length > 0 && (
                            <ul className="text-xs text-destructive space-y-1">
                              {user.errors.map((error, i) => (
                                <li key={i}>• {error}</li>
                              ))}
                            </ul>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {/* Import Results */}
          {importResults && (
            <div className="border rounded-lg p-6 text-center">
              <FileCheck className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="font-medium mb-2">Import Complete</h3>
              <div className="flex gap-4 justify-center">
                <div>
                  <p className="text-2xl font-bold text-green-500">{importResults.success}</p>
                  <p className="text-sm text-muted-foreground">Successful</p>
                </div>
                {importResults.failed > 0 && (
                  <div>
                    <p className="text-2xl font-bold text-destructive">{importResults.failed}</p>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {importResults ? 'Close' : 'Cancel'}
          </Button>
          {parsedUsers.length > 0 && !importResults && validCount > 0 && (
            <Button onClick={handleImport} disabled={importing} className="bg-[#003D7A] hover:bg-[#002a54] text-white">
              {importing ? 'Importing...' : `Import ${validCount} Users`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
