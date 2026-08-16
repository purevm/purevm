import { HttpClient } from '../src/index.js';
import 'dotenv/config';

// ===========================================================
// Client
// ===========================================================

const httpUrl = process.env['HTTP_URL'];

if (!httpUrl) {
    throw new Error('HTTP_URL is not set');
}

export const client = new HttpClient({
    url: httpUrl as `http://${string}` | `https://${string}`,
    timeoutMs: 30_000,
});