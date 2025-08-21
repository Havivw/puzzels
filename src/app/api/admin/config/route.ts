import { NextRequest, NextResponse } from 'next/server';
import { DataManager } from '@/lib/dataManager';
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
    const validation = DataManager.validateUser(uuid);
    if (!validation.valid || validation.role !== 'admin') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    const config = DataManager.getConfig();

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
    const validation = DataManager.validateUser(uuid);
    if (!validation.valid || validation.role !== 'admin') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    const { adminUuid, dashboardUuid } = body;

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

    const newConfig: AdminConfig = {
      adminUuid,
      dashboardUuid
    };

    const success = DataManager.updateConfig(newConfig);

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
