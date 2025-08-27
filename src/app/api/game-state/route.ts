import { NextRequest, NextResponse } from 'next/server';
import { HybridDataManager } from '@/lib/hybridDataManager';
import { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // This endpoint provides public access to game state
    // No authentication required since it only returns the game state
    const config = await HybridDataManager.getConfig();
    
    return NextResponse.json<ApiResponse<{ gameState: 'coming-soon' | 'active'; dashboardUuid: string }>>({
      success: true,
      data: {
        gameState: config.gameState || 'coming-soon',
        dashboardUuid: config.dashboardUuid || 'dash-52dc-2330-49f1-89e9-00fb6440cd5b'
      }
    });

  } catch (error) {
    console.error('Game state fetch error:', error);
    // Default to coming-soon on error for security
    return NextResponse.json<ApiResponse<{ gameState: 'coming-soon' | 'active'; dashboardUuid: string }>>({
      success: true,
      data: {
        gameState: 'coming-soon',
        dashboardUuid: 'dash-52dc-2330-49f1-89e9-00fb6440cd5b' // fallback
      }
    });
  }
}
