import { NextRequest, NextResponse } from 'next/server';
import { HybridDataManager } from '@/lib/hybridDataManager';
import { ApiResponse, DashboardData, AdminDashboardData, UserProgress } from '@/types';

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

    // Validate user
    const validation = await HybridDataManager.validateUser(uuid);
    if (!validation.valid || (validation.role !== 'admin' && validation.role !== 'dashboard')) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Access denied'
      }, { status: 403 });
    }

    const users = await HybridDataManager.getUsers();
    const questions = await HybridDataManager.getQuestions();
    const totalQuestions = questions.length;

    // Calculate user progress
    const userProgress = users.map(user => {
      const progress: UserProgress = {
        name: user.name,
        percentage: Math.round((user.completedQuestions.length / totalQuestions) * 100),
        completedCount: user.completedQuestions.length,
        totalQuestions,
        lastActivity: user.lastActivity
      };

      // Add UUID for admin view only
      if (validation.role === 'admin') {
        return { ...progress, uuid: user.uuid };
      }
      
      return progress;
    });

    const averageCompletion = users.length > 0 
      ? Math.round(users.reduce((sum, user) => sum + user.completedQuestions.length, 0) / users.length / totalQuestions * 100)
      : 0;

    if (validation.role === 'admin') {
      const adminData: AdminDashboardData = {
        totalUsers: users.length,
        averageCompletion,
        users: userProgress as (UserProgress & { uuid: string })[],
        lastUpdated: new Date().toISOString()
      };

      return NextResponse.json<ApiResponse<AdminDashboardData>>({
        success: true,
        data: adminData
      });
    } else {
      const dashboardData: DashboardData = {
        totalUsers: users.length,
        averageCompletion,
        users: userProgress,
        lastUpdated: new Date().toISOString()
      };

      return NextResponse.json<ApiResponse<DashboardData>>({
        success: true,
        data: dashboardData
      });
    }

  } catch (error) {
    console.error('Dashboard data error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
