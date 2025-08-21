import { NextRequest, NextResponse } from 'next/server';
import { HybridDataManager } from '@/lib/hybridDataManager';
import { ApiResponse, Question } from '@/types';
import { validateQuestionText, validateAnswer, validateHints, validateHintPassword, validateUuid } from '@/lib/security';

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

    const questions = await HybridDataManager.getQuestions();

    // NOTE: Admin endpoint intentionally returns full Question objects including answers and passwords
    // This is required for admin question editing functionality
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

    // Validate questions array
    if (!Array.isArray(body)) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Questions must be an array'
      }, { status: 400 });
    }

    // Validate and sanitize each question
    const sanitizedQuestions: Question[] = [];
    for (const question of body) {
      // Validate question text
      const textValidation = validateQuestionText(question.text);
      if (!textValidation.valid) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: `Invalid question text: ${textValidation.error}`
        }, { status: 400 });
      }

      // Validate answer
      const answerValidation = validateAnswer(question.answer);
      if (!answerValidation.valid) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: `Invalid answer: ${answerValidation.error}`
        }, { status: 400 });
      }

      // Validate hints
      const hintsValidation = validateHints(question.hints || []);
      if (!hintsValidation.valid) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: `Invalid hints: ${hintsValidation.error}`
        }, { status: 400 });
      }

      // Validate hint password
      const passwordValidation = validateHintPassword(question.hintPassword || '');
      if (!passwordValidation.valid) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: `Invalid hint password: ${passwordValidation.error}`
        }, { status: 400 });
      }

      // Create sanitized question
      sanitizedQuestions.push({
        id: question.id,
        text: textValidation.sanitized,
        answer: answerValidation.sanitized,
        hints: hintsValidation.sanitized,
        hintPassword: passwordValidation.sanitized,
        order: question.order
      });
    }

    const success = await HybridDataManager.saveQuestions(sanitizedQuestions);

    if (success) {
      // NOTE: Admin endpoint intentionally returns full Question objects for editing
      return NextResponse.json<ApiResponse<Question[]>>({
        success: true,
        data: sanitizedQuestions
      });
    } else {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to save questions'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Admin questions save error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
