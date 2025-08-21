import { NextRequest, NextResponse } from 'next/server';
import { HybridDataManager } from '@/lib/hybridDataManager';
import { ApiResponse, ValidationResult } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uuid = searchParams.get('uuid');

    if (!uuid) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'UUID parameter is required'
      }, { status: 400 });
    }

    const validation = await HybridDataManager.validateUser(uuid);

    return NextResponse.json<ApiResponse<ValidationResult>>({
      success: true,
      data: validation
    });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
