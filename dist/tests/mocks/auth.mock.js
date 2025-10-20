"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Mock JWT sign function for testing
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockImplementation((payload, secret, options) => {
        // Ensure options.expiresIn is properly set
        if (!options || typeof options.expiresIn !== 'string') {
            options = Object.assign(Object.assign({}, options), { expiresIn: '30d' });
        }
        return 'mock_token';
    })
}));
