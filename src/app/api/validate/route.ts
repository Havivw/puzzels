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
      // Return safe user data for puzzle interface (exclude UUID for security)
      validationResult = {
        valid: validation.valid,
        role: validation.role,
        user: {
          uuid: '', // Don't expose actual UUID 
          name: validation.user.name,
          currentQuestion: validation.user.currentQuestion,
          completedQuestions: validation.user.completedQuestions,
          createdAt: validation.user.createdAt,
          lastActivity: validation.user.lastActivity
          // Deliberately exclude: rateLimitData, actual uuid
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
