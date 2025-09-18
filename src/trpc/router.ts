import { archivesRouter } from "@/features/admin/archives/trpc";
import { clientProjectDashboardRouter } from "@/features/admin/client-project-dashboard/trpc";
import { projectsRouter } from "@/features/admin/projects/trpc";
import { applicationRouter } from "@/features/client/dashboard/trpc";
import { ipDisclosureRouter } from "@/features/client/ip-disclosure/trpc";
import { formIntegrationRouter } from "@/features/client/form-integration/trpc";
import { ipApplicationEnrollmentRouter } from "@/trpc/routers/ipApplicationEnrollment";
import { tasksRouter } from "@/server/api/routers/tasks";
import { router } from "@/trpc/init";
import { calendarRouter } from "@/features/admin/calendar/trpc";
import { userManagementRouter } from "@/features/admin/user-management/trpc";
import { usersRouter } from "@/trpc/routers/users";

export const appRouter = router({
  archives: archivesRouter,
  ipDisclosure: ipDisclosureRouter,
  clientProjectDashboard: clientProjectDashboardRouter,
  projects: projectsRouter,
  formIntegration: formIntegrationRouter,
  application: applicationRouter,
  ipApplicationEnrollment: ipApplicationEnrollmentRouter,
  tasks: tasksRouter,
  calendar: calendarRouter,
  userManagement: userManagementRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
