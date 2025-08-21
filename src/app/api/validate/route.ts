import { NextRequest, NextResponse } from 'next/server';
import { HybridDataManager } from '@/lib/hybridDataManager';
import { ApiResponse, SafeValidationResult } from '@/types';

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

    // Filter out sensitive user data
    const safeValidation: SafeValidationResult = {
      valid: validation.valid,
      role: validation.role
      // Deliberately exclude: user object
    };

    return NextResponse.json<ApiResponse<SafeValidationResult>>({
      success: true,
      data: safeValidation
    });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
