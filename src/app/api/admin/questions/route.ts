import { NextRequest, NextResponse } from 'next/server';
import { DataManager } from '@/lib/dataManager';
import { ApiResponse, Question } from '@/types';

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

    const questions = DataManager.getQuestions();

    return NextResponse.json<ApiResponse<Question[]>>({
      success: true,
      data: questions
    });

  } catch (error) {
    console.error('Admin questions fetch error:', error);
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

    const questions: Question[] = body;
    const success = DataManager.saveQuestions(questions);

    if (success) {
      return NextResponse.json<ApiResponse<Question[]>>({
        success: true,
        data: questions
      });
    } else {
      // Check if we're in production
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: 'Question editing is not available in production. Questions are read-only in the deployed version.'
        }, { status: 400 });
      } else {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: 'Failed to save questions'
        }, { status: 500 });
      }
    }

  } catch (error) {
    console.error('Admin questions save error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
