import assert from 'node:assert/strict'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import test from 'node:test'

import { HttpTransport } from '../src/clients/http/transport.js'
import { parseHttpUrl } from '../src/clients/http/utils/url.js'
import type { HttpUrl } from '../src/clients/http/utils/url.js'

async function withServer(
    handler: (request: IncomingMessage, response: ServerResponse) => void | Promise<void>,
    run: (url: HttpUrl) => Promise<void>,
): Promise<void> {
    const server = createServer((request, response) => {
        void Promise.resolve(handler(request, response)).catch((error: unknown) => {
            response.statusCode = 500
            response.end(error instanceof Error ? error.message : String(error))
        })
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    assert.ok(address && typeof address === 'object')
    try {
        await run(`http://127.0.0.1:${address.port}` as HttpUrl)
    } finally {
        await new Promise<void>((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve())),
        )
    }
}

async function jsonBody(request: IncomingMessage): Promise<{ id: number }> {
    const chunks: Buffer[] = []
    for await (const chunk of request) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as { id: number }
}

test('parseHttpUrl strips credentials and builds a Basic Authorization header', () => {
    const parsed = parseHttpUrl('https://user:p%40ss@rpc.example.com/path')
    assert.equal(parsed.url, 'https://rpc.example.com/path')
    assert.doesNotMatch(parsed.url, /user|p%40ss/)
    assert.equal(parsed.headers?.authorization, `Basic ${btoa('user:p@ss')}`)
})

test('HTTP transport uses URL Basic auth when no Authorization header is set', async () => {
    let authorization: string | undefined
    await withServer(async (request, response) => {
        authorization = request.headers.authorization
        const body = await jsonBody(request)
        response.writeHead(200, { 'content-type': 'application/json' })
        response.end(JSON.stringify({ jsonrpc: '2.0', id: body.id, result: true }))
    }, async (url) => {
        const transport = new HttpTransport({
            url: url.replace('http://', 'http://user:p%40ss@') as HttpUrl,
            timeoutMs: 5_000,
        })
        await transport.request({ method: 'eth_chainId' })
        assert.equal(authorization, `Basic ${btoa('user:p@ss')}`)
    })
})

test('HTTP transport applies URL auth, then transport headers, then request headers', async () => {
    const seen: string[] = []
    await withServer(async (request, response) => {
        seen.push(request.headers.authorization ?? '')
        const body = await jsonBody(request)
        assert.equal(request.headers['content-type'], 'application/json')
        response.writeHead(200, { 'content-type': 'application/json' })
        response.end(JSON.stringify({ jsonrpc: '2.0', id: body.id, result: true }))
    }, async (url) => {
        const authenticated = url.replace('http://', 'http://user:p%40ss@') as HttpUrl
        const transport = new HttpTransport({
            url: authenticated,
            timeoutMs: 5_000,
            headers: { authorization: 'Bearer transport' },
        })

        await transport.request({ method: 'eth_chainId' })
        await transport.request(
            { method: 'eth_chainId' },
            { headers: { authorization: 'Bearer request' } },
        )

        assert.deepEqual(seen, ['Bearer transport', 'Bearer request'])
    })
})
