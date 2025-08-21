import { NextRequest, NextResponse } from 'next/server';
import { HybridDataManager } from '@/lib/hybridDataManager';
import { ApiResponse, HintRoute } from '@/types';
import { validateQuestionText } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uuid = searchParams.get('uuid');

    if (!uuid) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Admin UUID is required'
      }, { status: 400 });
    }

    // Validate admin user
    const validation = await HybridDataManager.validateUser(uuid);
    if (!validation.valid || validation.role !== 'admin') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    const routes = await HybridDataManager.getHintRoutes();
    
    return NextResponse.json<ApiResponse<HintRoute[]>>({
      success: true,
      data: routes
    });

  } catch (error) {
    console.error('Hint routes fetch error:', error);
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

    if (!uuid) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Admin UUID is required'
      }, { status: 400 });
    }

    // Validate admin user
    const validation = await HybridDataManager.validateUser(uuid);
    if (!validation.valid || validation.role !== 'admin') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    const body = await request.json();
    const { content, expiresAt } = body;

    // Validate content
    const contentValidation = validateQuestionText(content);
    if (!contentValidation.valid) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: contentValidation.error || 'Invalid content'
      }, { status: 400 });
    }

    // Generate unique UUID for the route
    const routeUuid = `hint-${crypto.randomUUID()}`;
    
    const newRoute: HintRoute = {
      uuid: routeUuid,
      content: contentValidation.sanitized,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt || undefined,
      isActive: true
    };

    const success = await HybridDataManager.addHintRoute(newRoute);
    
    if (success) {
      return NextResponse.json<ApiResponse<HintRoute>>({
        success: true,
        data: newRoute
      });
    } else {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to create hint route'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Hint route creation error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uuid = searchParams.get('uuid');
    const routeUuid = searchParams.get('routeUuid');

    if (!uuid || !routeUuid) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Admin UUID and route UUID are required'
      }, { status: 400 });
    }

    // Validate admin user
    const validation = await HybridDataManager.validateUser(uuid);
    if (!validation.valid || validation.role !== 'admin') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    const success = await HybridDataManager.removeHintRoute(routeUuid);
    
    if (success) {
      return NextResponse.json<ApiResponse<null>>({
        success: true,
        data: null
      });
    } else {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to remove hint route'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Hint route deletion error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
