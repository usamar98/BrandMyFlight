import { z } from "zod";
import { fetchProjectMetadata } from "@/lib/project-metadata";

const requestSchema = z.object({ url: z.string().trim().min(3).max(240) });

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const project = await fetchProjectMetadata(body.url);
    return Response.json(project, {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to read that website.";
    return Response.json({ error: message }, { status: 422 });
  }
}
