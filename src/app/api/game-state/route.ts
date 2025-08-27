import { NextRequest, NextResponse } from 'next/server';
import { HybridDataManager } from '@/lib/hybridDataManager';
import { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // This endpoint provides public access to game state
    // No authentication required since it only returns the game state
    const config = await HybridDataManager.getConfig();
    
    return NextResponse.json<ApiResponse<{ gameState: 'coming-soon' | 'active' }>>({
      success: true,
      data: {
        gameState: config.gameState || 'coming-soon'
      }
    });

  } catch (error) {
    console.error('Game state fetch error:', error);
    // Default to coming-soon on error for security
    return NextResponse.json<ApiResponse<{ gameState: 'coming-soon' | 'active' }>>({
      success: true,
      data: {
        gameState: 'coming-soon'
      }
    });
  }
}
