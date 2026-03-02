import { Elysia } from 'elysia'

const app = new Elysia()
    .get('/', 'hello')
    .listen(3000)

export default app;