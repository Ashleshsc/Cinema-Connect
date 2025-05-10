declare module 'socket.io-client' {
  import { EventEmitter } from 'events';

  export interface Socket extends EventEmitter {
    id: string;
    connected: boolean;
    disconnected: boolean;
    connect(): Socket;
    disconnect(): Socket;
    emit(event: string, ...args: any[]): boolean;
    on(event: string, listener: (...args: any[]) => void): Socket;
    off(event: string, listener?: (...args: any[]) => void): Socket;
  }

  export function io(uri: string, opts?: any): Socket;
} 