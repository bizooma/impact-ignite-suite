import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Printer, Copy, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useCrmDonations } from '@/hooks/useCrmDonations';
import { useOrganization } from '@/hooks/useOrganization';
import type { CrmContact } from '@/hooks/useCrm';

interface Props {
  open: boolean;
  onClose: () => void;
  contact: CrmContact;
  organizationId: string;
}

export function TaxStatementDialog({ open, onClose, contact, organizationId }: Props) {
  const { donations } = useCrmDonations(organizationId, contact.id);
  const { organization } = useOrganization();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear - 1));

  const yearsAvailable = useMemo(() => {
    const years = new Set<string>();
    (donations || []).forEach(d => years.add(String(new Date(d.donation_date).getFullYear())));
    if (years.size === 0) years.add(String(currentYear));
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [donations, currentYear]);

  const yearDonations = useMemo(
    () => (donations || []).filter(d => String(new Date(d.donation_date).getFullYear()) === year)
                            .sort((a, b) => +new Date(a.donation_date) - +new Date(b.donation_date)),
    [donations, year]
  );

  const total = yearDonations.reduce((s, d) => s + Number(d.amount), 0);
  const orgName = organization?.name || 'Our Organization';
  const donorName = contact.contact_type === 'organization'
    ? contact.organization_name || 'Donor'
    : `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Donor';

  const printStatement = () => {
    const w = window.open('', '_blank');
    if (!w) { toast.error('Popup blocked'); return; }
    // Escape HTML to prevent XSS from user-sourced fields (org name, donor name, email, payment method)
    const esc = (v: unknown) => String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    const fmtAmount = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    w.document.write(`<!DOCTYPE html><html><head><title>Giving Statement ${esc(year)} - ${esc(donorName)}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; max-width: 720px; margin: 0 auto; color: #111; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        h2 { font-size: 16px; color: #555; margin-top: 0; font-weight: normal; }
        table { width: 100%; border-collapse: collapse; margin-top: 24px; }
        th, td { padding: 8px 6px; border-bottom: 1px solid #eee; text-align: left; }
        th { font-size: 12px; text-transform: uppercase; color: #666; }
        .total { font-weight: bold; border-top: 2px solid #111; }
        .footer { margin-top: 32px; font-size: 12px; color: #555; line-height: 1.5; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <h1>${esc(orgName)}</h1>
      <h2>Year-End Giving Statement — ${esc(year)}</h2>
      <p style="margin-top:24px"><strong>Donor:</strong> ${esc(donorName)}<br/>
      ${contact.email ? `<strong>Email:</strong> ${esc(contact.email)}<br/>` : ''}
      <strong>Statement Date:</strong> ${esc(format(new Date(), 'MMMM d, yyyy'))}</p>
      <table>
        <thead><tr><th>Date</th><th>Method</th><th style="text-align:right">Amount</th></tr></thead>
        <tbody>
          ${yearDonations.map(d => `<tr>
            <td>${esc(format(new Date(d.donation_date), 'MMM d, yyyy'))}</td>
            <td style="text-transform:capitalize">${esc((d.payment_method || '—').replace(/_/g, ' '))}</td>
            <td style="text-align:right">$${esc(fmtAmount(Number(d.amount)))}</td>
          </tr>`).join('')}
          <tr class="total"><td colspan="2">Total Contributions ${esc(year)}</td>
            <td style="text-align:right">$${esc(fmtAmount(total))}</td></tr>
        </tbody>
      </table>
      <div class="footer">
        <p>${esc(orgName)} is a tax-exempt organization. No goods or services were provided in exchange for these contributions, except as otherwise noted.</p>
        <p>Please retain this statement for your tax records. Consult your tax advisor regarding deductibility.</p>
      </div>
      <script>window.onload = () => window.print();</script>
      </body></html>`);
    w.document.close();
  };

  const copyText = async () => {
    const lines = [
      `${orgName} — Year-End Giving Statement (${year})`,
      ``,
      `Donor: ${donorName}`,
      contact.email ? `Email: ${contact.email}` : '',
      `Statement Date: ${format(new Date(), 'MMMM d, yyyy')}`,
      ``,
      `Date          | Method          | Amount`,
      `--------------|-----------------|----------`,
      ...yearDonations.map(d => `${format(new Date(d.donation_date), 'MMM d, yyyy').padEnd(13)} | ${(d.payment_method || '—').replace(/_/g, ' ').padEnd(15)} | $${Number(d.amount).toFixed(2)}`),
      `--------------|-----------------|----------`,
      `Total ${year}: $${total.toFixed(2)}`,
      ``,
      `${orgName} is a tax-exempt organization. No goods or services were provided in exchange for these contributions, except as otherwise noted.`,
    ].filter(Boolean).join('\n');
    try {
      await navigator.clipboard.writeText(lines);
      toast.success('Statement copied to clipboard');
    } catch {
      toast.error('Could not copy');
    }
  };

  const emailDraft = () => {
    if (!contact.email) { toast.error('No email on file'); return; }
    const subject = `Your ${year} giving statement from ${orgName}`;
    const body = `Dear ${contact.first_name || donorName},

Attached below is a summary of your charitable contributions to ${orgName} during ${year}. Please retain this for your tax records.

Total contributions in ${year}: $${total.toFixed(2)}

${yearDonations.map(d => `  • ${format(new Date(d.donation_date), 'MMM d, yyyy')} — $${Number(d.amount).toFixed(2)}`).join('\n')}

${orgName} is a tax-exempt organization. No goods or services were provided in exchange for these contributions.

Thank you for your generosity.

The ${orgName} Team`;
    window.open(`mailto:${encodeURIComponent(contact.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Giving Statement — {donorName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Tax Year</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {yearsAvailable.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex justify-between items-baseline mb-3">
              <h3 className="font-semibold">{orgName}</h3>
              <span className="text-sm text-muted-foreground">{year}</span>
            </div>
            {yearDonations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No donations recorded for {year}.</p>
            ) : (
              <>
                <div className="space-y-1 text-sm">
                  {yearDonations.map(d => (
                    <div key={d.id} className="flex justify-between py-1 border-b border-border/50">
                      <span>{format(new Date(d.donation_date), 'MMM d, yyyy')}</span>
                      <span className="capitalize text-muted-foreground">{(d.payment_method || '—').replace(/_/g, ' ')}</span>
                      <span className="font-medium">${Number(d.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-3 pt-2 border-t-2 border-foreground font-bold">
                  <span>Total {year}</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 flex-wrap">
          <Button variant="outline" onClick={copyText} disabled={yearDonations.length === 0}>
            <Copy className="h-4 w-4 mr-2" /> Copy as text
          </Button>
          <Button variant="outline" onClick={emailDraft} disabled={yearDonations.length === 0 || !contact.email}>
            <Mail className="h-4 w-4 mr-2" /> Email draft
          </Button>
          <Button onClick={printStatement} disabled={yearDonations.length === 0}>
            <Printer className="h-4 w-4 mr-2" /> Print / Save PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
