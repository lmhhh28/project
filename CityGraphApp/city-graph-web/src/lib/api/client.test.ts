import { describe, expect, it, vi } from "vitest";
import { ApiError, CityGraphApiClient } from "@/lib/api/client";
import { EMPTY_GRAPH } from "@/lib/api/types";

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("CityGraphApiClient", () => {
  const client = new CityGraphApiClient("http://localhost:9999/api/v1");

  it("parses successful graph responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        success: true,
        message: "Graph fetched.",
        data: EMPTY_GRAPH,
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const response = await client.getGraph();

    expect(response.message).toBe("Graph fetched.");
    expect(response.data).toEqual(EMPTY_GRAPH);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:9999/api/v1/graph", {
      method: "GET",
      headers: expect.any(Headers),
      body: undefined,
    });
  });

  it("throws ApiError with backend message on failed JSON requests", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        createJsonResponse(
          {
            success: false,
            message: "Edge not found: 1 <-> 2",
            data: null,
          },
          404,
        ),
      ),
    );

    await expect(client.removeEdge(1, 2)).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
      message: "Edge not found: 1 <-> 2",
    } satisfies Partial<ApiError>);
  });

  it("returns raw text for graph export", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("[CITIES]\n1,Beijing,100,200,capital", {
          status: 200,
          headers: {
            "Content-Type": "text/plain",
          },
        }),
      ),
    );

    await expect(client.exportGraphText()).resolves.toContain("[CITIES]");
  });
});
