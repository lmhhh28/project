package com.citygraph.model;

import java.util.Objects;

/**
 * Represents a communication line between two cities.
 */
public class Edge {

    private int sourceId;
    private int targetId;
    private int length; // Calculated as Euclidean distance

    // Added flag for visualization of extra edges (e.g. Kruskal MST, Steiner points)
    private boolean isVirtual; 
    private boolean isHighlighted;
    private boolean isSteiner;

    public Edge(int sourceId, int targetId) {
        this.sourceId = sourceId;
        this.targetId = targetId;
        this.length = 0; // Will be calculated dynamically when adding to graph if needed, or explicitly set
        this.isVirtual = false;
        this.isHighlighted = false;
        this.isSteiner = false;
    }

    public Edge(int sourceId, int targetId, int length) {
        this.sourceId = sourceId;
        this.targetId = targetId;
        this.length = length;
        this.isVirtual = false;
        this.isHighlighted = false;
        this.isSteiner = false;
    }

    public int getSourceId() { return sourceId; }
    public void setSourceId(int sourceId) { this.sourceId = sourceId; }

    public int getTargetId() { return targetId; }
    public void setTargetId(int targetId) { this.targetId = targetId; }

    public int getLength() { return length; }
    public void setLength(int length) { this.length = length; }

    public boolean isVirtual() { return isVirtual; }
    public void setVirtual(boolean virtual) { isVirtual = virtual; }

    public boolean isHighlighted() { return isHighlighted; }
    public void setHighlighted(boolean highlighted) { isHighlighted = highlighted; }

    public boolean isSteiner() { return isSteiner; }
    public void setSteiner(boolean steiner) { isSteiner = steiner; }

    /**
     * Helper to treat edges as undirected.
     */
    public boolean connects(int id1, int id2) {
        return (sourceId == id1 && targetId == id2) || (sourceId == id2 && targetId == id1);
    }
    
    public int getOtherId(int id) {
        if (sourceId == id) return targetId;
        if (targetId == id) return sourceId;
        return -1;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Edge edge = (Edge) o;
        // Undirected graph logic
        return (sourceId == edge.sourceId && targetId == edge.targetId) ||
               (sourceId == edge.targetId && targetId == edge.sourceId);
    }

    @Override
    public int hashCode() {
        int min = Math.min(sourceId, targetId);
        int max = Math.max(sourceId, targetId);
        return Objects.hash(min, max);
    }

    @Override
    public String toString() {
        return sourceId + " <-> " + targetId + " (Len: " + length + ")";
    }
}
