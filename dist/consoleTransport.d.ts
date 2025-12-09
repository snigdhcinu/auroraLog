import { ConsoleTransportOptions, LogEntry } from './types.js';
export declare class ConsoleTransport {
    private mode;
    private console;
    constructor(options?: ConsoleTransportOptions);
    write(entry: LogEntry): void;
}
