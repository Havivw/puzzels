import { NextRequest, NextResponse } from 'next/server';
import { HybridDataManager } from '@/lib/hybridDataManager';
import { ApiResponse, User } from '@/types';
import { validateUuid } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uuid = searchParams.get('uuid');

    if (!uuid || !validateUuid(uuid)) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Valid UUID parameter is required'
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

    const users = await HybridDataManager.getUsers();

    // NOTE: This admin endpoint intentionally returns full User objects including rateLimitData
    // This is secure because it requires admin authentication and is needed for rate limit management
    return NextResponse.json<ApiResponse<User[]>>({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Admin rate limits fetch error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uuid = searchParams.get('uuid');
    const body = await request.json();
    const { userUuid, type } = body;

    if (!uuid || !validateUuid(uuid)) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Valid UUID parameter is required'
      }, { status: 400 });
    }

    if (!userUuid || !type) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'userUuid and type are required'
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

    // Reset rate limits based on type
    if (type === 'answer' || type === 'both') {
      // Reset answer rate limit by clearing consecutive failures and lock
      const users = await HybridDataManager.getUsers();
      const userIndex = users.findIndex(u => u.uuid === userUuid);
      if (userIndex !== -1 && users[userIndex].rateLimitData) {
        users[userIndex].rateLimitData.consecutiveFailures = 0;
        delete users[userIndex].rateLimitData.lockedUntil;
        await HybridDataManager.saveUsers(users);
      }
    }

    if (type === 'hint-password' || type === 'both') {
      // Reset hint password rate limit
      await HybridDataManager.resetHintPasswordFailures(userUuid);
    }

    return NextResponse.json<ApiResponse<{ success: boolean }>>({
      success: true,
      data: { success: true }
    });

  } catch (error) {
    console.error('Admin rate limit reset error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}




