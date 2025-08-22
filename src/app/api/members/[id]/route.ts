import { NextRequest, NextResponse } from 'next/server';
import { updateTeamMember, removeTeamMember } from '@/lib/db/team';
import {UpdateTeamMemberInput, ApiResponse, TeamMemberWithUser, MessagePayload  } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, props: RouteParams): Promise<NextResponse<ApiResponse<TeamMemberWithUser>>> {
  const params = await props.params;
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid member ID'
      }, { status: 400 });
    }
    
    const body: UpdateTeamMemberInput = await request.json();
    
    const member = await updateTeamMember(id, body);
    if (!member) {
      return NextResponse.json({
        success: false,
        error: 'Team member not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: member
    });
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update team member'
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
        error: 'Invalid member ID'
      }, { status: 400 });
    }
    
    const success = await removeTeamMember(id);
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Team member not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: { message: 'Team member removed successfully' }
    });
  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to remove team member'
    }, { status: 500 });
  }
}