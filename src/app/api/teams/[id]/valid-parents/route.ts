import { NextRequest, NextResponse } from 'next/server';
import {getAllTeams, getValidParentTeams} from '@/lib/queries';
import { ApiResponse } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, props: RouteParams): Promise<NextResponse<ApiResponse<any>>> {
  const params = await props.params;
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid team ID'
      }, { status: 400 });
    }
    
    const validParents = await getValidParentTeams(id);
    
    return NextResponse.json({
      success: true,
      data: validParents
    });
  } catch (error) {
    console.error('Error fetching valid parent teams:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch valid parent teams'
    }, { status: 500 });
  }
}