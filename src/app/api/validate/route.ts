import { NextRequest, NextResponse } from 'next/server';
import { HybridDataManager } from '@/lib/hybridDataManager';
import { ApiResponse, ValidationResult, SecureUser, InternalValidationResult } from '@/types';

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

    const internalValidation: InternalValidationResult = await HybridDataManager.validateUser(uuid);

    // Convert internal validation to public validation result (filter sensitive data)
    let validationResult: ValidationResult;
    
    if (internalValidation.role === 'user' && internalValidation.user) {
      // SECURITY: Only return basic user info, NO progress data
      // Progress must be fetched from /api/question which validates server-side
      const secureUser: SecureUser = {
        uuid: '', // Don't expose actual UUID 
        name: internalValidation.user.name,
        createdAt: internalValidation.user.createdAt,
        lastActivity: internalValidation.user.lastActivity
        // Deliberately exclude: currentQuestion, completedQuestions, rateLimitData
      };
      
      validationResult = {
        valid: internalValidation.valid,
        role: internalValidation.role,
        user: secureUser
      };
    } else {
      // For admin/dashboard roles, don't include user object
      validationResult = {
        valid: internalValidation.valid,
        role: internalValidation.role,
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
