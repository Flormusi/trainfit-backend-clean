import * as jwt from 'jsonwebtoken';

declare module 'jsonwebtoken' {
  export function sign(
    payload: string | object | Buffer,
    secretOrPrivateKey: string,
    options?: jwt.SignOptions
  ): string;
}