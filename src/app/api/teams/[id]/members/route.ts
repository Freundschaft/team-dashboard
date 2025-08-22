import { NextRequest, NextResponse } from 'next/server';
import { getTeamMembers, addTeamMember } from '@/lib/queries';
import {CreateTeamMemberInput, ApiResponse, TeamMemberWithUser} from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, props: RouteParams): Promise<NextResponse<ApiResponse<TeamMemberWithUser[]>>> {
  const params = await props.params;
  try {
    const teamId = parseInt(params.id);
    if (isNaN(teamId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid team ID'
      }, { status: 400 });
    }
    
    const members = await getTeamMembers(teamId);
    return NextResponse.json({
      success: true,
      data: members
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch team members'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest, props: RouteParams): Promise<NextResponse<ApiResponse<TeamMemberWithUser>>> {
  const params = await props.params;
  try {
    const teamId = parseInt(params.id);
    if (isNaN(teamId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid team ID'
      }, { status: 400 });
    }
    
    const body: CreateTeamMemberInput = await request.json();
    
    if (!body.user_id) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }
    
    const memberInput = {
      ...body,
      team_id: teamId
    };
    
    const member = await addTeamMember(memberInput);
    return NextResponse.json({
      success: true,
      data: member
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding team member:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add team member'
    }, { status: 500 });
  }
}