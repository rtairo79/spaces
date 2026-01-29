import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PatronDashboard } from '@/components/patron/dashboard';

export default async function PatronPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return <PatronDashboard session={session} />;
}