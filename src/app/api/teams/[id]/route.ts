import { NextRequest, NextResponse } from 'next/server';
import { getTeamById, updateTeam, deleteTeam } from '@/lib/db/team';
import {UpdateTeamInput, ApiResponse, MessagePayload, Team} from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, props: RouteParams): Promise<NextResponse<ApiResponse<Team>>> {
  const params = await props.params;
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid team ID'
      }, { status: 400 });
    }
    
    const team = await getTeamById(id);
    if (!team) {
      return NextResponse.json({
        success: false,
        error: 'Team not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch team'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, props: RouteParams): Promise<NextResponse<ApiResponse<Team>>> {
  const params = await props.params;
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid team ID'
      }, { status: 400 });
    }
    
    const body: UpdateTeamInput = await request.json();
    
    if (body.name !== undefined && body.name.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Team name cannot be empty'
      }, { status: 400 });
    }
    
    const team = await updateTeam(id, body);
    if (!team) {
      return NextResponse.json({
        success: false,
        error: 'Team not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to update team ${error}`
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, props: RouteParams): Promise<NextResponse<ApiResponse<MessagePayload>>> {
  const params = await props.params;
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid team ID'
      }, { status: 400 });
    }
    
    const success = await deleteTeam(id);
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Team not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: { message: 'Team deleted successfully' }
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete team'
    }, { status: 500 });
  }
}