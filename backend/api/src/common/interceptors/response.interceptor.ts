import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface Response<T> {
  statusCode: string;
  data: T;
  message: string;
  errors: string[];
  isSuccess: boolean;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        statusCode: 'ok',
        data: data || {},
        message: 'Operation completed successfully',
        errors: [],
        isSuccess: true,
      })),
      catchError((error) => {
        let message = 'An unexpected error occurred';
        let statusCode = 'error';
        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let errors: string[] = [];

        if (error instanceof HttpException) {
          const response = error.getResponse();
          message = error.message;
          status = error.getStatus();
          if (status === HttpStatus.BAD_REQUEST) {
            statusCode = 'validation_error';
            errors = Array.isArray(response['message'])? response['message'] : [];
          }
        } else if (error instanceof Error) {
          message = error.message;
        }

        return throwError(
          () =>
            new HttpException(
              {
                statusCode,
                data: {},
                message,
                errors,
                isSuccess: false,
              },
              status,
            ),
        );
      }),
    );
  }
}
