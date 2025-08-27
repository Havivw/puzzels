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

    // Only return user object for user role, and filter sensitive data
    let validationResult: ValidationResult;
    
    if (validation.role === 'user' && validation.user) {
      // SECURITY: Only return basic user info, NO progress data
      // Progress must be fetched from /api/question which validates server-side
      validationResult = {
        valid: validation.valid,
        role: validation.role,
        user: {
          uuid: '', // Don't expose actual UUID 
          name: validation.user.name,
          // REMOVED: currentQuestion, completedQuestions (security risk)
          createdAt: validation.user.createdAt,
          lastActivity: validation.user.lastActivity
          // Deliberately exclude: rateLimitData, actual uuid, progress data
        }
      };
    } else {
      // For admin/dashboard roles, don't include user object
      validationResult = {
        valid: validation.valid,
        role: validation.role,
        user: undefined
      };
    }

    return NextResponse.json<ApiResponse<ValidationResult>>({
      success: true,
      data: validationResult
    });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
