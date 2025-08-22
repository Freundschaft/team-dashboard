import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, createUser } from '@/lib/queries';
import { ApiResponse, User, CreateUserInput } from '@/types';

export async function GET(): Promise<NextResponse<ApiResponse<User[]>>> {
  try {
    const users = await getAllUsers();
    return NextResponse.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<User>>> {
  try {
    const body = await request.json();
    const userData: CreateUserInput = {
      name: body.name,
      email: body.email
    };

    if (!userData.name || !userData.email) {
      return NextResponse.json({
        success: false,
        error: 'Name and email are required'
      }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, { status: 400 });
    }

    const user = await createUser(userData);
    return NextResponse.json({
      success: true,
      data: user
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}