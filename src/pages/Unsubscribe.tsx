import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

type Status =
  | 'validating'
  | 'ready'
  | 'already_unsubscribed'
  | 'invalid'
  | 'submitting'
  | 'success'
  | 'error'

export default function Unsubscribe() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState<Status>('validating')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      setErrorMsg('Missing unsubscribe token.')
      return
    }
    ;(async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } },
        )
        const data = await res.json()
        if (!res.ok) {
          setStatus('invalid')
          setErrorMsg(data?.error || 'Invalid or expired link.')
          return
        }
        if (data?.valid === false && data?.reason === 'already_unsubscribed') {
          setStatus('already_unsubscribed')
          return
        }
        if (data?.valid === true) {
          setStatus('ready')
          return
        }
        setStatus('invalid')
        setErrorMsg('Invalid response from server.')
      } catch (err) {
        setStatus('error')
        setErrorMsg(err instanceof Error ? err.message : 'Network error')
      }
    })()
  }, [token])

  const handleConfirm = async () => {
    if (!token) return
    setStatus('submitting')
    const { data, error } = await supabase.functions.invoke(
      'handle-email-unsubscribe',
      { body: { token } },
    )
    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
      return
    }
    if ((data as any)?.success) {
      setStatus('success')
    } else if ((data as any)?.reason === 'already_unsubscribed') {
      setStatus('already_unsubscribed')
    } else {
      setStatus('error')
      setErrorMsg('Failed to unsubscribe.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Unsubscribe from emails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'validating' && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Validating link…
            </div>
          )}
          {status === 'ready' && (
            <>
              <p className="text-sm text-muted-foreground">
                Click below to confirm you want to stop receiving these emails.
              </p>
              <Button onClick={handleConfirm} className="w-full">
                Confirm unsubscribe
              </Button>
            </>
          )}
          {status === 'submitting' && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Processing…
            </div>
          )}
          {status === 'success' && (
            <p className="text-sm text-foreground">
              You've been unsubscribed. You won't receive these emails anymore.
            </p>
          )}
          {status === 'already_unsubscribed' && (
            <p className="text-sm text-foreground">
              This email address is already unsubscribed.
            </p>
          )}
          {status === 'invalid' && (
            <p className="text-sm text-destructive">
              {errorMsg || 'Invalid or expired unsubscribe link.'}
            </p>
          )}
          {status === 'error' && (
            <p className="text-sm text-destructive">
              {errorMsg || 'Something went wrong.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
