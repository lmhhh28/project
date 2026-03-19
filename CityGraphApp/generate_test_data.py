import random
import sys
import argparse
import math

def generate_data(num_cities, num_edges, output_file, max_coord=400):
    cities = []
    # Generate Cities
    for i in range(1, num_cities + 1):
        x = random.randint(-max_coord, max_coord)
        y = random.randint(-max_coord, max_coord)
        name = f"City_{i}"
        desc = f"city_{i}"
        cities.append((i, name, x, y, desc))

    # Generate Edges
    edges = set()
    
    # Optional: ensure basic connectivity by making a spanning tree first
    # So the graph has a higher chance of being mostly connected.
    connected_nodes = [1]
    unconnected_nodes = list(range(2, num_cities + 1))
    random.shuffle(unconnected_nodes)
    
    for node in unconnected_nodes:
        # connect to a random already-connected node
        target = random.choice(connected_nodes)
        edge = tuple(sorted((node, target)))
        edges.add(edge)
        connected_nodes.append(node)

    # Generate the remaining random edges
    remaining_edges = num_edges - (num_cities - 1)
    if remaining_edges > 0:
        for _ in range(remaining_edges):
            u = random.randint(1, num_cities)
            v = random.randint(1, num_cities)
            if u != v:
                edge = tuple(sorted((u, v)))
                edges.add(edge)

    # Write to file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("[CITIES]\n")
        for c in cities:
            f.write(f"{c[0]},{c[1]},{c[2]},{c[3]},{c[4]}\n")
            
        f.write("[EDGES]\n")
        for e in edges:
            # Length is set to 0 as a convention; the Java backend (GraphState.addEdge)
            # automatically recalculates the Euclidean distance from city coordinates.
            f.write(f"{e[0]},{e[1]},0\n")

    print(f"✅ 成功生成测试数据集: {output_file}")
    print(f"📊 统计信息: {num_cities} 个城市节点, {len(edges)} 条通信线路.")
    print(f"📍 坐标范围: X, Y ∈ [{-max_coord}, {max_coord}]")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate mock data for CityGraphApp")
    parser.add_argument("-c", "--cities", type=int, default=50, help="Number of cities to generate (default: 50)")
    parser.add_argument("-e", "--edges", type=int, default=80, help="Number of edges to generate (default: 80)")
    parser.add_argument("-o", "--output", type=str, default="test_data.txt", help="Output file name (default: test_data.txt)")
    parser.add_argument("-m", "--max_coord", type=int, default=400, help="Max coordinate value for X and Y in the Cartesian plane (default: 400)")

    args = parser.parse_args()
    
    cities = getattr(args, 'cities', 50)
    edges = getattr(args, 'edges', 80)
    output = getattr(args, 'output', 'test_data.txt')
    max_coord = getattr(args, 'max_coord', 400)
    
    # Validate
    max_possible_edges = (cities * (cities - 1)) // 2
    if edges > max_possible_edges:
        print(f"⚠️ 警告: 要求的边数 ({edges}) 超过了完全图的最大边数 ({max_possible_edges})。将自动修正为最大边数。")
        edges = max_possible_edges

    generate_data(cities, edges, output, max_coord)
