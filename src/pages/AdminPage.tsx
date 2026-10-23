import * as React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AdminOverviewTab } from '@/components/admin/OverviewTab'
import { ClientsTab } from '@/components/admin/ClientsTab'
import { AdminsTab } from '@/components/admin/AdminsTab'
import { ProgramsTab } from '@/components/admin/ProgramsTab'
import { ActivityTab } from '@/components/admin/ActivityTab'
import { CodesTab } from '@/components/admin/CodesTab'
import { activity, profiles, programs, roles } from '@/lib/backend/api'
import type { ActivityLogEntry, Profile, WorkoutProgram } from '@/lib/types'

export default function AdminPage() {
  const { role, roleLoading } = useAuth()
  const [tab, setTab] = React.useState('overview')
  const [tick, setTick] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [allProfiles, setAllProfiles] = React.useState<Profile[]>([])
  const [adminList, setAdminList] = React.useState<Profile[]>([])
  const [programList, setProgramList] = React.useState<WorkoutProgram[]>([])
  const [activityList, setActivityList] = React.useState<ActivityLogEntry[]>([])

  React.useEffect(() => {
    if (role !== 'admin') return
    let cancelled = false
    ;(async () => {
      const [allP, admins, progs, acts] = await Promise.all([
        profiles.listAll(),
        roles.listAdmins(),
        programs.listAll(),
        activity.listAll(),
      ])
      if (cancelled) return
      setAllProfiles(allP)
      setAdminList(admins)
      setProgramList(progs)
      setActivityList(acts)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [role, tick])

  if (roleLoading) return null
  if (role !== 'admin') return <Navigate to="/" replace />
  if (loading) return null

  const adminIds = new Set(adminList.map((a) => a.id))
  const clientList = allProfiles.filter((p) => !adminIds.has(p.id))
  const refresh = () => setTick((t) => t + 1)

  return (
    <div className="container py-8 sm:py-12">
      <h1 className="font-display text-4xl tracking-wide mb-8">Admin dashboard</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="codes">Codes</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <AdminOverviewTab clients={clientList} admins={adminList} programList={programList} activityList={activityList} />
        </TabsContent>

        <TabsContent value="clients" className="mt-6">
          <ClientsTab
            key={tick}
            clients={clientList}
            programList={programList}
            activityList={activityList}
            onRoleChange={refresh}
          />
        </TabsContent>

        <TabsContent value="admins" className="mt-6">
          <AdminsTab key={tick} admins={adminList} clients={clientList} onRoleChange={refresh} />
        </TabsContent>

        <TabsContent value="programs" className="mt-6">
          <ProgramsTab programList={programList} people={allProfiles} />
        </TabsContent>

        <TabsContent value="codes" className="mt-6">
          <CodesTab people={allProfiles} />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <ActivityTab log={activityList} people={allProfiles} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
