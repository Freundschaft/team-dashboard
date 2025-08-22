import { NextRequest, NextResponse } from 'next/server';
import { getTeamsHierarchy, createTeam } from '@/lib/queries';
import { CreateTeamInput, ApiResponse, TeamsHierarchyResponse } from '@/types';

export async function GET(): Promise<NextResponse<ApiResponse<TeamsHierarchyResponse>>> {
  try {
    const teams = await getTeamsHierarchy();
    return NextResponse.json({
      success: true,
      data: { teams }
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch teams'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const body: CreateTeamInput = await request.json();
    
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Team name is required'
      }, { status: 400 });
    }
    
    const team = await createTeam(body);
    return NextResponse.json({
      success: true,
      data: team
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create team'
    }, { status: 500 });
  }
}