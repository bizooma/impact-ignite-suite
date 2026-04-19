import { useOrganization } from '@/hooks/useOrganization';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Building2, Check, ChevronsUpDown } from 'lucide-react';

interface Props {
  collapsed?: boolean;
}

export function OrgSwitcher({ collapsed }: Props) {
  const { organization, organizations, switchOrganization } = useOrganization();

  if (!organizations || organizations.length === 0) return null;

  return (
    <div className="px-3 pb-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between gap-2 h-auto py-2"
            aria-label="Switch organization"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <span className="truncate text-xs font-medium text-left">
                  {organization?.name ?? 'Select organization'}
                </span>
              )}
            </div>
            {!collapsed && <ChevronsUpDown className="h-3.5 w-3.5 opacity-60 shrink-0" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuLabel>Switch organization</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => switchOrganization(org.id)}
              className="cursor-pointer"
            >
              <Building2 className="h-4 w-4 mr-2 opacity-70" />
              <span className="flex-1 truncate">{org.name}</span>
              {organization?.id === org.id && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
