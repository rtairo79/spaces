import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { StaffDashboard } from '@/components/staff/dashboard';

export default async function StaffPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role === 'PATRON') {
    redirect('/login');
  }

  return <StaffDashboard session={session} />;
}