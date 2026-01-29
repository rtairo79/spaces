import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    // Show public spaces dashboard for unauthenticated users
    redirect('/spaces');
  }

  // Redirect based on user role
  if (session.user.role === 'ADMIN') {
    redirect('/admin');
  } else if (session.user.role === 'STAFF') {
    redirect('/staff');
  } else {
    redirect('/patron');
  }
}