import { NextRequest, NextResponse } from 'next/server';
import { HybridDataManager } from '@/lib/hybridDataManager';
import { ApiResponse, User } from '@/types';
import { v4 as uuidv4 } from 'uuid';

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

    const users = await HybridDataManager.getUsers();

    return NextResponse.json<ApiResponse<User[]>>({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Admin users fetch error:', error);
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
    const { name } = body;

    if (!uuid) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'UUID parameter is required'
      }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'User name is required'
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

    // Generate new user UUID
    const newUserUuid = `user-${uuidv4()}`;
    const success = await HybridDataManager.addUser(name, newUserUuid);

    if (success) {
      const users = await HybridDataManager.getUsers();
      const newUser = users.find(u => u.uuid === newUserUuid);
      
      return NextResponse.json<ApiResponse<User>>({
        success: true,
        data: newUser!
      });
    } else {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to create user'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Admin user creation error:', error);
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
    const userUuid = searchParams.get('userUuid');

    if (!uuid || !userUuid) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'UUID and userUuid parameters are required'
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

    const success = DataManager.removeUser(userUuid);

    if (success) {
      return NextResponse.json<ApiResponse<{ deleted: boolean }>>({
        success: true,
        data: { deleted: true }
      });
    } else {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to delete user or user not found'
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Admin user deletion error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
