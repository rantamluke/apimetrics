/**
 * Unit tests for auth middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth';
import { db } from '../db';

// Mock dependencies
jest.mock('../db');
jest.mock('jsonwebtoken');
jest.mock('../routes/auth');

const mockedDb = db as jest.Mocked<typeof db>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should reject request without authorization header', async () => {
      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing authorization header',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should authenticate valid JWT token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        plan: 'free',
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-jwt-token',
      };

      mockedJwt.verify.mockReturnValue({ userId: 'user-123' } as any);
      mockedDb.query.mockResolvedValue({
        rows: [mockUser],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockedJwt.verify).toHaveBeenCalled();
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject invalid JWT token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      mockedJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject JWT for non-existent user', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-jwt-token',
      };

      mockedJwt.verify.mockReturnValue({ userId: 'user-999' } as any);
      mockedDb.query.mockResolvedValue({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid token',
      });
    });

    it('should reject invalid authorization format', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token',
      };

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid authorization format',
      });
    });
  });
});
