# City Graph API (Frontend Integration)

## 1. Service Startup

```bash
cd /Users/lmhhh/Desktop/project/CityGraphApp/city-graph-api
./mvnw spring-boot:run
```

Default base URL:

```text
http://localhost:8080/api/v1
```

## 2. Unified Response Format

All JSON endpoints return:

```json
{
  "success": true,
  "message": "Graph fetched.",
  "data": {}
}
```

Error response example:

```json
{
  "success": false,
  "message": "City not found: 100",
  "data": null
}
```

## 3. Data Model

### 3.1 `City`

```json
{
  "id": 1,
  "name": "Beijing",
  "x": 100,
  "y": 200,
  "description": "capital"
}
```

### 3.2 `Edge`

```json
{
  "sourceId": 1,
  "targetId": 2,
  "length": 200,
  "virtual": false,
  "highlighted": true,
  "steiner": false
}
```

### 3.3 `Graph`

```json
{
  "cities": [],
  "edges": [],
  "summary": {
    "cityCount": 0,
    "edgeCount": 0,
    "realEdgeCount": 0,
    "virtualEdgeCount": 0,
    "steinerEdgeCount": 0
  }
}
```

## 4. Graph Endpoints

### 4.1 Get Current Graph
- Method: `GET`
- Path: `/graph`
- Response `data`: `Graph`

### 4.2 Clear Entire Graph
- Method: `DELETE`
- Path: `/graph`
- Response `data`: `Graph` (empty)

### 4.3 Clear Highlights and Generated Edges
- Method: `POST`
- Path: `/graph/clear-highlights`
- Behavior:
  - Removes highlighted, virtual, and steiner edges
  - Restores backed up real edges if available
- Response `data`: `Graph`

### 4.4 Add City
- Method: `POST`
- Path: `/graph/cities`
- Body:

```json
{
  "id": 1,
  "name": "Beijing",
  "x": 100,
  "y": 200,
  "description": "capital"
}
```

- Response `data`: updated `Graph`

### 4.5 Update City
- Method: `PUT`
- Path: `/graph/cities/{cityId}`
- Body:

```json
{
  "name": "Beijing-New",
  "x": 120,
  "y": 220,
  "description": "updated"
}
```

- Response `data`: updated `Graph`

### 4.6 Remove City
- Method: `DELETE`
- Path: `/graph/cities/{cityId}`
- Response `data`: updated `Graph`

### 4.7 Add Edge
- Method: `POST`
- Path: `/graph/edges`
- Body:

```json
{
  "sourceId": 1,
  "targetId": 2
}
```

- Response `data`: updated `Graph`

### 4.8 Remove Edge
- Method: `DELETE`
- Path: `/graph/edges?sourceId=1&targetId=2`
- Response `data`: updated `Graph`

### 4.9 Import Graph from TXT File
- Method: `POST`
- Path: `/graph/import`
- Content-Type: `multipart/form-data`
- Form field:
  - `file`: `.txt` graph file
- Response `data`:

```json
{
  "warnings": ["..."],
  "graph": { }
}
```

### 4.10 Export Graph as TXT
- Method: `GET`
- Path: `/graph/export`
- Response:
  - Content-Type: `text/plain`
  - `Content-Disposition: attachment; filename=city-graph.txt`

## 5. Algorithm Endpoints

Important: Every algorithm endpoint first performs internal `clear-highlights` behavior, matching desktop app semantics.

### 5.1 Q5 Connectivity Fix (Kruskal)
- Method: `POST`
- Path: `/algorithms/connectivity-fix`
- Body: none
- Response `data`:

```json
{
  "algorithm": "Q5_CONNECTIVITY_FIX",
  "logs": ["Graph is NOT fully connected..."],
  "graph": { }
}
```

### 5.2 Q6 Shortest Path (Dijkstra)
- Method: `POST`
- Path: `/algorithms/shortest-path`
- Body:

```json
{
  "sourceId": 1
}
```

- Response `data`: `AlgorithmResult`

### 5.3 Q7 TSP
- Method: `POST`
- Path: `/algorithms/tsp`
- Body:

```json
{
  "startCityId": 1,
  "returnToStart": true
}
```

- Response `data`: `AlgorithmResult`

### 5.4 Q8 Steiner Tree
- Method: `POST`
- Path: `/algorithms/steiner-tree`
- Body: none
- Response `data`: `AlgorithmResult`

## 6. Health Endpoint

### 6.1 Health Check
- Method: `GET`
- Path: `/health`

Example response:

```json
{
  "success": true,
  "message": "Service is up.",
  "data": {
    "status": "UP",
    "timestamp": "2026-03-28T11:17:11.001936Z"
  }
}
```

## 7. HTTP Status Codes

- `200`: Request succeeded
- `400`: Invalid params / invalid body / business rule violation
- `404`: Target city or edge does not exist
- `500`: Unexpected internal error

## 8. Frontend Quick cURL Smoke Test

```bash
BASE=http://localhost:8080/api/v1

curl -X POST "$BASE/graph/cities" -H 'Content-Type: application/json' \
  -d '{"id":1,"name":"Beijing","x":100,"y":200,"description":"capital"}'

curl -X POST "$BASE/graph/cities" -H 'Content-Type: application/json' \
  -d '{"id":2,"name":"Shanghai","x":260,"y":320,"description":"metro"}'

curl -X POST "$BASE/graph/edges" -H 'Content-Type: application/json' \
  -d '{"sourceId":1,"targetId":2}'

curl -X POST "$BASE/algorithms/shortest-path" -H 'Content-Type: application/json' \
  -d '{"sourceId":1}'

curl "$BASE/graph/export"
```

## 9. TypeScript SDK (for Frontend)

Files:
- `frontend/types.ts`: all response/request types
- `frontend/client.ts`: lightweight fetch client
- `frontend/index.ts`: unified exports

Example usage:

```ts
import { CityGraphApiClient } from "./frontend";

const api = new CityGraphApiClient("http://localhost:8080/api/v1");

async function demo() {
  await api.addCity({ id: 1, name: "Beijing", x: 100, y: 200, description: "capital" });
  await api.addCity({ id: 2, name: "Shanghai", x: 260, y: 320, description: "metro" });
  await api.addEdge({ sourceId: 1, targetId: 2 });

  const result = await api.runShortestPath({ sourceId: 1 });
  console.log(result.data?.logs);
}
```
