import { NextRequest, NextResponse } from 'next/server';
import { HybridDataManager } from '@/lib/hybridDataManager';
import { ApiResponse, AdminConfig } from '@/types';

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

    // Validate admin access
    const validation = await HybridDataManager.validateUser(uuid);
    if (!validation.valid || validation.role !== 'admin') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    const config = await HybridDataManager.getConfig();

    // NOTE: Admin endpoint intentionally returns UUIDs for management functionality
    // This is secure because it requires admin authentication
    return NextResponse.json<ApiResponse<AdminConfig>>({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Config fetch error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uuid = searchParams.get('uuid');
    const body = await request.json();

    if (!uuid) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'UUID parameter is required'
      }, { status: 400 });
    }

    // Validate admin access
    const validation = await HybridDataManager.validateUser(uuid);
    if (!validation.valid || validation.role !== 'admin') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    const { adminUuid, dashboardUuid, rateLimitConfig } = body;

    if (!adminUuid || !dashboardUuid) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'adminUuid and dashboardUuid are required'
      }, { status: 400 });
    }

    // Ensure the UUIDs are different
    if (adminUuid === dashboardUuid) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Admin and dashboard UUIDs must be different'
      }, { status: 400 });
    }

    // Validate rate limit config if provided
    if (rateLimitConfig) {
      const { answerAttempts, hintPasswordAttempts } = rateLimitConfig;
      
      if (answerAttempts) {
        if (typeof answerAttempts.maxFailures !== 'number' || answerAttempts.maxFailures < 1 || answerAttempts.maxFailures > 20) {
          return NextResponse.json<ApiResponse<null>>({
            success: false,
            error: 'Answer attempts maxFailures must be between 1 and 20'
          }, { status: 400 });
        }
        if (typeof answerAttempts.lockTimeMinutes !== 'number' || answerAttempts.lockTimeMinutes < 1 || answerAttempts.lockTimeMinutes > 1440) {
          return NextResponse.json<ApiResponse<null>>({
            success: false,
            error: 'Answer attempts lockTimeMinutes must be between 1 and 1440 (24 hours)'
          }, { status: 400 });
        }
      }
      
      if (hintPasswordAttempts) {
        if (typeof hintPasswordAttempts.maxFailures !== 'number' || hintPasswordAttempts.maxFailures < 1 || hintPasswordAttempts.maxFailures > 20) {
          return NextResponse.json<ApiResponse<null>>({
            success: false,
            error: 'Hint password attempts maxFailures must be between 1 and 20'
          }, { status: 400 });
        }
        if (typeof hintPasswordAttempts.lockTimeMinutes !== 'number' || hintPasswordAttempts.lockTimeMinutes < 1 || hintPasswordAttempts.lockTimeMinutes > 1440) {
          return NextResponse.json<ApiResponse<null>>({
            success: false,
            error: 'Hint password attempts lockTimeMinutes must be between 1 and 1440 (24 hours)'
          }, { status: 400 });
        }
      }
    }

    const newConfig: AdminConfig = {
      adminUuid,
      dashboardUuid,
      rateLimitConfig
    };

    const success = await HybridDataManager.updateConfig(newConfig);

    if (success) {
      return NextResponse.json<ApiResponse<AdminConfig>>({
        success: true,
        data: newConfig
      });
    } else {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to update configuration'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Config update error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
