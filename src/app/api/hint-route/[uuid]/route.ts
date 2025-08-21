import { NextRequest, NextResponse } from 'next/server';
import { HybridDataManager } from '@/lib/hybridDataManager';
import { ApiResponse, HintRoute, SafeHintRoute } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;
  try {

    if (!uuid) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'UUID is required'
      }, { status: 400 });
    }

    // Check if this is a hint route by looking for the 'hint-' prefix
    if (!uuid.startsWith('hint-')) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Invalid hint route'
      }, { status: 400 });
    }

    const routes = await HybridDataManager.getHintRoutes();
    const hintRoute: HintRoute | undefined = routes.find(r => r.uuid === uuid && r.isActive);
    
    if (!hintRoute) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Hint route not found'
      }, { status: 404 });
    }

    // Check if route has expired
    if (hintRoute.expiresAt && new Date() > new Date(hintRoute.expiresAt)) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Hint route has expired'
      }, { status: 410 });
    }

    // Filter out sensitive data before sending to client
    const safeHintRoute: SafeHintRoute = {
      content: hintRoute.content
      // Deliberately excludes: uuid, createdAt, expiresAt, isActive
    };

    return NextResponse.json<ApiResponse<SafeHintRoute>>({
      success: true,
      data: safeHintRoute
    });

  } catch (error) {
    console.error('Hint route fetch error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
