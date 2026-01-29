import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const where = activeOnly ? { active: true } : {};

    const programTypes = await prisma.programType.findMany({
      where,
      include: {
        _count: {
          select: {
            reservations: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(programTypes);
  } catch (error) {
    console.error('Error fetching program types:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    
    const programType = await prisma.programType.create({
      data: {
        name: body.name,
        description: body.description,
        active: body.active ?? true,
      },
    });

    return NextResponse.json(programType, { status: 201 });
  } catch (error) {
    console.error('Error creating program type:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}