import { NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/queries';
import {ApiResponse, User} from '@/types';

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