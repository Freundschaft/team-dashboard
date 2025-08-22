import { NextRequest, NextResponse } from 'next/server';
import { updateTeamMember, removeTeamMember } from '@/lib/queries';
import { UpdateTeamMemberInput, ApiResponse } from '@/types';

interface RouteParams {
  params: { id: string };
}

export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse<ApiResponse<any>>> {
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

export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse<ApiResponse<any>>> {
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