import * as React from 'react'
import { Bell, Check, Info, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { openExactAlarmSettings, runRestAlarmCheck, stopRestAlarmNow, type CheckLine } from '@/lib/restTimer'

/** Account-page tool (phone app only): tests the rest alert and explains anything that would stop it. */
export function RestAlarmCheck() {
  const [running, setRunning] = React.useState(false)
  const [lines, setLines] = React.useState<CheckLine[]>([])

  const start = async () => {
    setRunning(true)
    setLines([])
    await runRestAlarmCheck(setLines)
    setRunning(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5 text-primary" /> Rest timer alert
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 font-body text-sm">
        <p className="text-muted-foreground">
          Not hearing or feeling the alert when a rest ends? This checks your phone's settings and sends a test alert
          after 10 seconds.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={start} disabled={running} className="gap-1.5">
            {running && <Loader2 className="h-4 w-4 animate-spin" />}
            {running ? 'Testing…' : 'Test rest alert'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => void openExactAlarmSettings()}>
            Allow exact alerts
          </Button>
          <Button size="sm" variant="outline" onClick={() => void stopRestAlarmNow()}>
            Stop alert
          </Button>
        </div>
        {lines.length > 0 && (
          <ul className="space-y-2">
            {lines.map((line, i) => (
              <li key={i} className="flex gap-2">
                {line.ok === true ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                ) : line.ok === false ? (
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                ) : (
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className={line.ok === false ? 'text-destructive' : 'text-muted-foreground'}>{line.text}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
