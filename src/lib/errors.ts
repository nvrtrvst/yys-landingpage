export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Tidak terautentikasi') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Dilarang') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Data tidak ditemukan') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Terlalu banyak permintaan. Coba lagi nanti.') {
    super(message, 429);
  }
}

export class FileTooLargeError extends AppError {
  constructor(maxSize: string) {
    super(`Ukuran file terlalu besar (maksimal ${maxSize}).`, 413);
  }
}

export function handleApiError(error: unknown): Response {
  if (error instanceof AppError) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: error.statusCode, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  if (error instanceof Error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Kesalahan server internal' }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  console.error('Unknown error type:', error);
  return new Response(
    JSON.stringify({ error: 'Kesalahan server internal' }),
    { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

export function logError(error: unknown, context?: string): void {
  const prefix = context ? `[${context}]` : '';
  
  if (error instanceof AppError && error.isOperational) {
    console.warn(`${prefix} ${error.name}: ${error.message}`);
    return;
  }

  if (error instanceof Error) {
    console.error(`${prefix} Unexpected error:`, error);
    return;
  }

  console.error(`${prefix} Unknown error:`, error);
}