import { NextResponse } from 'next/server';
import { HybridDataManager } from '@/lib/hybridDataManager';

export async function GET() {
  try {
    // Initialize production database if needed
    await HybridDataManager.initializeProduction();
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully'
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize database'
    }, { status: 500 });
  }
}
