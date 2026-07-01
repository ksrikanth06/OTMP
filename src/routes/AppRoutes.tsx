import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { HomePage } from '@/pages/HomePage';
import { OvertimeApprovalsPage } from '@/pages/manager/OvertimeApprovalsPage';
import { MyTeamPage } from '@/pages/manager/MyTeamPage';
import { ShiftPlanPage } from '@/pages/manager/ShiftPlanPage';
import { EmployeeShiftPlanPage } from '@/pages/manager/EmployeeShiftPlanPage';
import { EmployeeAttendancePage } from '@/pages/manager/EmployeeAttendancePage';
import { TeamMembersPage } from '@/pages/manager/TeamMembersPage';
import { HrApprovalsPage } from '@/pages/hr/HrApprovalsPage';
import { HrPayrollPage } from '@/pages/hr/HrPayrollPage';
import { MyAttendancePage } from '@/pages/employee/MyAttendancePage';
import { OvertimeRequestsPage } from '@/pages/employee/OvertimeRequestsPage';
import { MyShiftDetailsPage } from '@/pages/employee/MyShiftDetailsPage';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<DashboardLayout />}>
          <Route index element={<HomePage />} />
          {/* Employee */}
          <Route path="overtime-requests" element={<OvertimeRequestsPage />} />
          <Route path="timesheet" element={<MyAttendancePage />} />
          <Route path="shift-details" element={<MyShiftDetailsPage />} />
          {/* Manager */}
          <Route path="approvals" element={<OvertimeApprovalsPage />} />
          <Route path="team" element={<MyTeamPage />} />
          <Route path="team/:empId/shift-plan" element={<EmployeeShiftPlanPage />} />
          <Route path="team/:managerId/members" element={<TeamMembersPage />} />
          <Route path="team/shift-plan" element={<ShiftPlanPage />} />
          <Route path="team/employee-attendance" element={<EmployeeAttendancePage />} />
          {/* HR */}
          <Route path="hr-approvals" element={<HrApprovalsPage />} />
          <Route path="hr-payroll" element={<HrPayrollPage />} />
          <Route path="*" element={<HomePage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
