import { Client } from "pg";

export interface Env {
    // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
    // MY_KV_NAMESPACE: KVNamespace;
    //
    // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
    // MY_DURABLE_OBJECT: DurableObjectNamespace;
    //
    // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
    // MY_BUCKET: R2Bucket;
    //
    // Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
    // MY_SERVICE: Fetcher;

    COCKROACH_URL: string;
}

export default {
    async fetch(
        request: Request,
        env: Env,
        ctx: ExecutionContext
    ): Promise<Response> {
        console.log("RECEIVED REQUEST");
        try {
            const client = new Client(env.COCKROACH_URL);
            await client.connect();

            if (request.method === "POST") {
                console.log("POSTING A NEW USER");
                const body: Record<string, string> = await request.json();
                const name = (body && body.name) || "anonymous";

                console.log("INSERT USER " + name);
                const res = await client.query(
                    "INSERT INTO users (name) VALUES ($1) RETURNING *",
                    [name]
                );
                return new Response(JSON.stringify(res.rows[0]));
                //create user
            } else if (request.method === "GET") {
                console.log("GETTING ALL USERS");
                const res = await client.query("SELECT * FROM users");
                return new Response(JSON.stringify(res.rows));
            }
        } catch (err) {
            console.error(err);
            return new Response("Internal error", { status: 500 });
        }

        return new Response("Unsupported method", { status: 400 });
    },
};
