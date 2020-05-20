const { createServer: createServer } = require('http');
function checkMethod(e) {
    if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(e))
        throw new Error('invalid method');
}
function checkPath(e) {
    if ('string' != typeof e) {
        if (!(e instanceof RegExp))
            throw new Error('path must be string or RegExp');
        if (!e.source.startsWith('^\\/') || !e.source.endsWith('$'))
            throw new Error('path must start with ^/ and ends with $');
    } else if (!e.startsWith('/')) throw new Error('path must start with /');
}
class RegexRouter {
    constructor() {
        (this.routes = new Map()),
            (this.middlewares = []),
            (this.notFoundHandler = (e, t) => {
                (t.statusCode = 404),
                    t.end(JSON.stringify({ error: 'Not found' }));
            }),
            (this.internalErrorHandler = (t, s) => {
                (s.statusCode = 500),
                    s.end(JSON.stringify({ error: e.message }));
            });
    }
    use(e) {
        this.middlewares.push(e),
            (this.notFoundHandler = e(this.notFoundHandler)),
            (this.internalErrorHandler = e(this.internalErrorHandler));
    }
    register(e, t, s, ...r) {
        checkMethod(e),
            checkPath(t),
            (s = r.reduce((e, t) => t(e), s)),
            (s = this.middlewares.reduce((e, t) => t(e), s)),
            this.routes.has(e)
                ? this.routes.get(e).set(t, s)
                : this.routes.set(e, new Map([[t, s]]));
    }
    handle(e, t) {
        if (!this.routes.has(e.method)) return void this.notFoundHandler(e, t);
        const s = [...this.routes.get(e.method).entries()].find(([t, s]) =>
            'string' == typeof t ? t === e.url : t.test(e.url)
        );
        if (void 0 === s) return void this.notFoundHandler(e, t);
        const [r, i] = s;
        try {
            r instanceof RegExp && (e.matches = r.exec(e.url).groups), i(e, t);
        } catch (s) {
            this.internalErrorHandler(e, t);
        }
    }
}
const cors = (e) => (t, s) => {
        if (!t.headers.origin) return void e(t, s);
        const r = { 'access-control-allow-origin': '*' };
        if ('OPTIONS' !== t.method) {
            Object.entries(r).forEach(([e, t]) => s.setHeader(e, t));
            try {
                return void e(t, s);
            } catch (e) {
                throw ((e.headers = { ...e.headers, ...r }), e);
            }
        }
        t.headers['access-control-request-method'] &&
            (Object.entries({
                ...r,
                'access-control-allow-methods': 'GET, POST, PUT, DELETE, PATCH',
            }).forEach(([e, t]) => s.setHeader(e, t)),
            t.headers['access-control-request-headers'] &&
                s.setHeader(
                    'access-control-allow-headers',
                    t.headers['access-control-request-headers']
                ),
            (s.statusCode = 204),
            s.end());
    },
    slow = (e) => (t, s) => {
        setTimeout(() => {
            e(t, s);
        }, 5e3);
    },
    log = (e) => (t, s) => {
        console.info(`incoming request: ${t.method} ${t.url}`), e(t, s);
    },
    json = (e) => (t, s) => {
        const r = [];
        t.on('data', (e) => {
            r.push(e);
        }),
            t.on('end', () => {
                (t.body = JSON.parse(Buffer.concat(r).toString())),
                    console.info(t.body),
                    e(t, s);
            });
    },
    router = new RegexRouter();
router.use(log), router.use(cors);
{
    const e = [
        { id: 3, type: 'text', content: 'Final Week!' },
        { id: 2, type: 'image', content: './img/logo_js.svg' },
        { id: 1, type: 'video', content: './video/video.mp4' },
    ];
    router.register(
        'GET',
        '/api/hw29/posts',
        (t, s) => {
            s.setHeader('Content-Type', 'application/json'),
                s.end(JSON.stringify(e));
        },
        slow
    );
}
{
    const e = [
        { id: 3, type: 'text', content: 'Final Week!' },
        { id: 2, type: 'image', content: './img/logo_js.svg' },
        { id: 1, type: 'video', content: './video/video.mp4' },
    ];
    let t = 0;
    router.register(
        'GET',
        '/api/hw30/posts',
        (s, r) => {
            if (++t % 3 == 0)
                return (
                    (r.statusCode = 500),
                    r.setHeader('Content-Type', 'application/json'),
                    void r.end(
                        JSON.stringify({
                            message:
                                'Сервер временно недоступен, попробуйте повторить ваш запрос позже',
                        })
                    )
                );
            r.setHeader('Content-Type', 'application/json'),
                r.end(JSON.stringify(e));
        },
        slow
    );
}
router.register('GET', '/api/hw31/success', (e, t) => {
    t.setHeader('Content-Type', 'application/json'),
        t.end(JSON.stringify({ status: 'ok' }));
}),
    router.register('GET', '/api/hw31/error', (e, t) => {
        (t.statusCode = 500),
            (t.statusText = 'Internal Server Error'),
            t.setHeader('Content-Type', 'application/json'),
            t.end(JSON.stringify({ message: 'unknown error' }));
    }),
    router.register(
        'POST',
        '/api/hw31/success',
        (e, t) => {
            t.setHeader('Content-Type', 'application/json'),
                t.end(JSON.stringify(e.body));
        },
        json
    );
{
    let e = 1,
        t = [];
    router.register(
        'GET',
        '/api/hw32/posts',
        (e, s) => {
            s.setHeader('Content-Type', 'application/json'),
                s.end(JSON.stringify(t));
        },
        slow
    ),
        router.register(
            'POST',
            '/api/hw32/posts',
            (s, r) => {
                const i = s.body;
                (i.id = e++),
                    (t = [i, ...t]),
                    r.setHeader('Content-Type', 'application/json'),
                    r.end(JSON.stringify(i));
            },
            json,
            slow
        ),
        router.register(
            'DELETE',
            /^\/api\/hw32\/posts\/(?<id>\d+)$/,
            (e, s) => {
                const r = Number(e.matches.id);
                if (Number.isNaN(r))
                    return (
                        (s.statusCode = 400),
                        void s.send(JSON.stringify({ error: 'bad id' }))
                    );
                (t = t.filter((e) => e.id !== r)),
                    (s.statusCode = 204),
                    s.end();
            },
            slow
        );
}
{
    let e = 1,
        t = [];
    router.register(
        'GET',
        '/api/hw33/posts',
        (e, s) => {
            s.setHeader('Content-Type', 'application/json'),
                s.end(JSON.stringify(t));
        },
        slow
    ),
        router.register(
            'POST',
            '/api/hw33/posts',
            (s, r) => {
                const i = s.body;
                (i.id = e++),
                    (i.likes = 0),
                    (t = [i, ...t]),
                    r.setHeader('Content-Type', 'application/json'),
                    r.end(JSON.stringify(i));
            },
            json,
            slow
        ),
        router.register(
            'DELETE',
            /^\/api\/hw33\/posts\/(?<id>\d+)$/,
            (e, s) => {
                const r = Number(e.matches.id);
                if (Number.isNaN(r))
                    return (
                        (s.statusCode = 400),
                        void s.send(JSON.stringify({ error: 'bad id' }))
                    );
                (t = t.filter((e) => e.id !== r)),
                    (s.statusCode = 204),
                    s.end();
            },
            slow
        ),
        router.register(
            'POST',
            /^\/api\/hw33\/posts\/(?<id>\d+)\/likes$/,
            (e, s) => {
                const r = Number(e.matches.id);
                if (Number.isNaN(r))
                    return (
                        (s.statusCode = 400),
                        void s.send(JSON.stringify({ error: 'bad id' }))
                    );
                (t = t.map((e) =>
                    e.id !== r ? e : { ...e, likes: e.likes + 1 }
                )),
                    (s.statusCode = 204),
                    s.end();
            },
            slow
        ),
        router.register(
            'DELETE',
            /^\/api\/hw33\/posts\/(?<id>\d+)\/likes$/,
            (e, s) => {
                const r = Number(e.matches.id);
                if (Number.isNaN(r))
                    return (
                        (s.statusCode = 400),
                        void s.send(JSON.stringify({ error: 'bad id' }))
                    );
                (t = t.map((e) =>
                    e.id !== r ? e : { ...e, likes: e.likes - 1 }
                )),
                    (s.statusCode = 204),
                    s.end();
            },
            slow
        );
}
{
    let e = 1,
        t = 1,
        s = [];
    router.register(
        'GET',
        '/api/hw34/posts',
        (e, t) => {
            t.setHeader('Content-Type', 'application/json'),
                t.end(JSON.stringify(s));
        },
        slow
    ),
        router.register(
            'POST',
            '/api/hw34/posts',
            (t, r) => {
                const i = t.body;
                (i.id = e++),
                    (i.likes = 0),
                    (i.comments = []),
                    (s = [i, ...s]),
                    r.setHeader('Content-Type', 'application/json'),
                    r.end(JSON.stringify(i));
            },
            json,
            slow
        ),
        router.register(
            'DELETE',
            /^\/api\/hw34\/posts\/(?<id>\d+)$/,
            (e, t) => {
                const r = Number(e.matches.id);
                if (Number.isNaN(r))
                    return (
                        (t.statusCode = 400),
                        void t.send(JSON.stringify({ error: 'bad id' }))
                    );
                (s = s.filter((e) => e.id !== r)),
                    (t.statusCode = 204),
                    t.end();
            },
            slow
        ),
        router.register(
            'POST',
            /^\/api\/hw34\/posts\/(?<id>\d+)\/likes$/,
            (e, t) => {
                const r = Number(e.matches.id);
                if (Number.isNaN(r))
                    return (
                        (t.statusCode = 400),
                        void t.send(JSON.stringify({ error: 'bad id' }))
                    );
                (s = s.map((e) =>
                    e.id !== r ? e : { ...e, likes: e.likes + 1 }
                )),
                    (t.statusCode = 204),
                    t.end();
            },
            slow
        ),
        router.register(
            'DELETE',
            /^\/api\/hw34\/posts\/(?<id>\d+)\/likes$/,
            (e, t) => {
                const r = Number(e.matches.id);
                if (Number.isNaN(r))
                    return (
                        (t.statusCode = 400),
                        void t.send(JSON.stringify({ error: 'bad id' }))
                    );
                (s = s.map((e) =>
                    e.id !== r ? e : { ...e, likes: e.likes - 1 }
                )),
                    (t.statusCode = 204),
                    t.end();
            },
            slow
        ),
        router.register(
            'POST',
            /^\/api\/hw34\/posts\/(?<id>\d+)\/comments$/,
            (e, r) => {
                const i = Number(e.matches.id);
                if (Number.isNaN(i))
                    return (
                        (r.statusCode = 400),
                        void r.send(JSON.stringify({ error: 'bad id' }))
                    );
                const o = e.body;
                (o.id = t++),
                    (s = s.map((e) =>
                        e.id !== i ? e : { ...e, comments: [...e.comments, o] }
                    )),
                    r.setHeader('Content-Type', 'application/json'),
                    r.end(JSON.stringify(o));
            },
            json,
            slow
        );
}
{
    let e = 1,
        t = 1,
        s = [];
    router.register(
        'GET',
        '/api/hw35/posts',
        (e, t) => {
            t.setHeader('Content-Type', 'application/json'),
                t.end(JSON.stringify(s));
        },
        slow
    ),
        router.register(
            'POST',
            '/api/hw35/posts',
            (t, r) => {
                const i = t.body;
                0 === i.id
                    ? ((i.id = e++),
                      (i.likes = 0),
                      (i.comments = []),
                      (s = [i, ...s]))
                    : (s = s.map((e) =>
                          e.id !== i.id
                              ? e
                              : { ...e, author: i.author, text: i.text }
                      )),
                    r.setHeader('Content-Type', 'application/json'),
                    r.end(JSON.stringify(i));
            },
            json,
            slow
        ),
        router.register(
            'DELETE',
            /^\/api\/hw35\/posts\/(?<id>\d+)$/,
            (e, t) => {
                const r = Number(e.matches.id);
                if (Number.isNaN(r))
                    return (
                        (t.statusCode = 400),
                        void t.send(JSON.stringify({ error: 'bad id' }))
                    );
                (s = s.filter((e) => e.id !== r)),
                    (t.statusCode = 204),
                    t.end();
            },
            slow
        ),
        router.register(
            'POST',
            /^\/api\/hw35\/posts\/(?<id>\d+)\/likes$/,
            (e, t) => {
                const r = Number(e.matches.id);
                if (Number.isNaN(r))
                    return (
                        (t.statusCode = 400),
                        void t.send(JSON.stringify({ error: 'bad id' }))
                    );
                (s = s.map((e) =>
                    e.id !== r ? e : { ...e, likes: e.likes + 1 }
                )),
                    (t.statusCode = 204),
                    t.end();
            },
            slow
        ),
        router.register(
            'DELETE',
            /^\/api\/hw35\/posts\/(?<id>\d+)\/likes$/,
            (e, t) => {
                const r = Number(e.matches.id);
                if (Number.isNaN(r))
                    return (
                        (t.statusCode = 400),
                        void t.send(JSON.stringify({ error: 'bad id' }))
                    );
                (s = s.map((e) =>
                    e.id !== r ? e : { ...e, likes: e.likes - 1 }
                )),
                    (t.statusCode = 204),
                    t.end();
            },
            slow
        ),
        router.register(
            'POST',
            /^\/api\/hw35\/posts\/(?<id>\d+)\/comments$/,
            (e, r) => {
                const i = Number(e.matches.id);
                if (Number.isNaN(i))
                    return (
                        (r.statusCode = 400),
                        void r.send(JSON.stringify({ error: 'bad id' }))
                    );
                const o = e.body;
                (o.id = t++),
                    (s = s.map((e) =>
                        e.id !== i ? e : { ...e, comments: [...e.comments, o] }
                    )),
                    r.setHeader('Content-Type', 'application/json'),
                    r.end(JSON.stringify(o));
            },
            json,
            slow
        );
}
{
    let e = 1,
        t = 1,
        s = [];
    router.register('GET', '/api/hw36/posts', (e, t) => {
        t.setHeader('Content-Type', 'application/json'),
            t.end(JSON.stringify(s));
    }),
        router.register(
            'GET',
            /^\/api\/hw36\/posts\/newer\/(?<id>\d+)$/,
            (e, t) => {
                const r = Number(e.matches.id);
                if (Number.isNaN(r))
                    return (
                        (t.statusCode = 400),
                        void t.send(JSON.stringify({ error: 'bad id' }))
                    );
                const i = s.filter((e) => e.id > r);
                t.setHeader('Content-Type', 'application/json'),
                    t.end(JSON.stringify(i));
            }
        ),
        router.register(
            'POST',
            '/api/hw36/posts',
            (t, r) => {
                const i = t.body;
                0 === i.id
                    ? ((i.id = e++),
                      (i.likes = 0),
                      (i.comments = []),
                      (s = [i, ...s]))
                    : (s = s.map((e) =>
                          e.id !== i.id
                              ? e
                              : { ...e, author: i.author, text: i.text }
                      )),
                    r.setHeader('Content-Type', 'application/json'),
                    r.end(JSON.stringify(i));
            },
            json
        ),
        router.register(
            'DELETE',
            /^\/api\/hw36\/posts\/(?<id>\d+)$/,
            (e, t) => {
                const r = Number(e.matches.id);
                if (Number.isNaN(r))
                    return (
                        (t.statusCode = 400),
                        void t.send(JSON.stringify({ error: 'bad id' }))
                    );
                (s = s.filter((e) => e.id !== r)),
                    (t.statusCode = 204),
                    t.end();
            }
        ),
        router.register(
            'POST',
            /^\/api\/hw36\/posts\/(?<id>\d+)\/likes$/,
            (e, t) => {
                const r = Number(e.matches.id);
                if (Number.isNaN(r))
                    return (
                        (t.statusCode = 400),
                        void t.send(JSON.stringify({ error: 'bad id' }))
                    );
                (s = s.map((e) =>
                    e.id !== r ? e : { ...e, likes: e.likes + 1 }
                )),
                    (t.statusCode = 204),
                    t.end();
            }
        ),
        router.register(
            'DELETE',
            /^\/api\/hw36\/posts\/(?<id>\d+)\/likes$/,
            (e, t) => {
                const r = Number(e.matches.id);
                if (Number.isNaN(r))
                    return (
                        (t.statusCode = 400),
                        void t.send(JSON.stringify({ error: 'bad id' }))
                    );
                (s = s.map((e) =>
                    e.id !== r ? e : { ...e, likes: e.likes - 1 }
                )),
                    (t.statusCode = 204),
                    t.end();
            }
        ),
        router.register(
            'POST',
            /^\/api\/hw36\/posts\/(?<id>\d+)\/comments$/,
            (e, r) => {
                const i = Number(e.matches.id);
                if (Number.isNaN(i))
                    return (
                        (r.statusCode = 400),
                        void r.send(JSON.stringify({ error: 'bad id' }))
                    );
                const o = e.body;
                (o.id = t++),
                    (s = s.map((e) =>
                        e.id !== i ? e : { ...e, comments: [...e.comments, o] }
                    )),
                    r.setHeader('Content-Type', 'application/json'),
                    r.end(JSON.stringify(o));
            },
            json
        );
}
const server = createServer((e, t) => router.handle(e, t));
server.listen(9999, () => {
    console.info('server started at http://127.0.0.1:9999');
});
