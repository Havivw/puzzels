import DOMPurify from 'dompurify';

// Input validation and sanitization utilities

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (typeof window === 'undefined') {
    // Server-side: basic escape for SSR
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  // Client-side: use DOMPurify
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [] // No attributes allowed
  });
}

/**
 * Validate and sanitize user name input
 */
export function validateUserName(name: string): { valid: boolean; sanitized: string; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, sanitized: '', error: 'Name is required' };
  }

  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, sanitized: '', error: 'Name cannot be empty' };
  }
  
  if (trimmed.length > 50) {
    return { valid: false, sanitized: '', error: 'Name must be 50 characters or less' };
  }
  
  // Allow only alphanumeric, spaces, and basic punctuation
  const validNameRegex = /^[a-zA-Z0-9\s\-_.]+$/;
  if (!validNameRegex.test(trimmed)) {
    return { valid: false, sanitized: '', error: 'Name contains invalid characters' };
  }
  
  const sanitized = sanitizeHtml(trimmed);
  return { valid: true, sanitized };
}

/**
 * Validate and sanitize question text
 */
export function validateQuestionText(text: string): { valid: boolean; sanitized: string; error?: string } {
  if (!text || typeof text !== 'string') {
    return { valid: false, sanitized: '', error: 'Question text is required' };
  }

  const trimmed = text.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, sanitized: '', error: 'Question text cannot be empty' };
  }
  
  if (trimmed.length > 500) {
    return { valid: false, sanitized: '', error: 'Question text must be 500 characters or less' };
  }
  
  const sanitized = sanitizeHtml(trimmed);
  return { valid: true, sanitized };
}

/**
 * Validate and sanitize answer text
 */
export function validateAnswer(answer: string): { valid: boolean; sanitized: string; error?: string } {
  if (!answer || typeof answer !== 'string') {
    return { valid: false, sanitized: '', error: 'Answer is required' };
  }

  const trimmed = answer.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, sanitized: '', error: 'Answer cannot be empty' };
  }
  
  if (trimmed.length > 100) {
    return { valid: false, sanitized: '', error: 'Answer must be 100 characters or less' };
  }
  
  const sanitized = sanitizeHtml(trimmed);
  return { valid: true, sanitized };
}

/**
 * Validate and sanitize hint text
 */
export function validateHints(hints: string[]): { valid: boolean; sanitized: string[]; error?: string } {
  if (!Array.isArray(hints)) {
    return { valid: false, sanitized: [], error: 'Hints must be an array' };
  }
  
  if (hints.length > 5) {
    return { valid: false, sanitized: [], error: 'Maximum 5 hints allowed' };
  }
  
  const sanitized: string[] = [];
  
  for (const hint of hints) {
    if (typeof hint !== 'string') {
      return { valid: false, sanitized: [], error: 'All hints must be strings' };
    }
    
    const trimmed = hint.trim();
    if (trimmed.length === 0) continue; // Skip empty hints
    
    if (trimmed.length > 200) {
      return { valid: false, sanitized: [], error: 'Each hint must be 200 characters or less' };
    }
    
    sanitized.push(sanitizeHtml(trimmed));
  }
  
  return { valid: true, sanitized };
}

/**
 * Validate UUID format
 */
export function validateUuid(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') return false;
  
  // Basic UUID format validation (allows custom format like user-xxx-xxx)
  const uuidRegex = /^[a-zA-Z0-9\-]{8,50}$/;
  return uuidRegex.test(uuid);
}

/**
 * Validate hint password
 */
export function validateHintPassword(password: string): { valid: boolean; sanitized: string; error?: string } {
  if (!password) {
    return { valid: true, sanitized: '' }; // Empty password is allowed
  }
  
  if (typeof password !== 'string') {
    return { valid: false, sanitized: '', error: 'Password must be a string' };
  }
  
  const trimmed = password.trim();
  
  if (trimmed.length > 50) {
    return { valid: false, sanitized: '', error: 'Password must be 50 characters or less' };
  }
  
  // Allow alphanumeric and basic symbols only
  const validPasswordRegex = /^[a-zA-Z0-9\-_@#$%^&*()+={}[\]|\\:";'<>?,./~`!]+$/;
  if (!validPasswordRegex.test(trimmed)) {
    return { valid: false, sanitized: '', error: 'Password contains invalid characters' };
  }
  
  return { valid: true, sanitized: trimmed };
}

/**
 * Sanitize error messages to prevent XSS
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    return 'An error occurred';
  }
  
  return sanitizeHtml(message);
}




