package com.citygraph.model;


import java.util.Objects;

/**
 * Represents a city in the graph.
 */
public class City {

    private int id;
    private String name;
    private int x;
    private int y;
    private String description;

    public City(int id, String name, int x, int y, String description) {
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.description = description;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getX() { return x; }
    public void setX(int x) { this.x = x; }

    public int getY() { return y; }
    public void setY(int y) { this.y = y; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        City city = (City) o;
        return id == city.id;
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return id + ": " + name + " (" + x + ", " + y + ")";
    }
}
