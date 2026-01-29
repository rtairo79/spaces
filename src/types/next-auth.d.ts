import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'ADMIN' | 'STAFF' | 'PATRON';
      locationId?: string;
    } & DefaultSession['user'];
  }

  interface User {
    role: 'ADMIN' | 'STAFF' | 'PATRON';
    locationId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'ADMIN' | 'STAFF' | 'PATRON';
    locationId?: string;
  }
}