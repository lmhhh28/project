package com.citygraph.view;

import com.citygraph.model.City;
import com.citygraph.model.Edge;
import com.citygraph.model.GraphState;

import javax.swing.*;
import java.awt.*;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;

/**
 * Custom JPanel to render the graph (cities and edges).
 */
public class GraphCanvas extends JPanel {
    private GraphState graph;
    
    // Zoom & Pan concepts (simplified for exact coordinates mapping if needed)
    private static final int CITY_RADIUS = 10;

    public GraphCanvas(GraphState graph, AppController controller) {
        this.graph = graph;
        this.setBackground(Color.WHITE);

        // Simple click listener to select a city
        this.addMouseListener(new MouseAdapter() {
            @Override
            public void mouseClicked(MouseEvent e) {
                City clickedCity = findCityAt(e.getX(), e.getY());
                if (clickedCity != null) {
                    controller.onCityClicked(clickedCity);
                }
            }
        });
    }

    private City findCityAt(int x, int y) {
        // Convert screen coordinates to logical grid coordinates
        int logicalX = x - getWidth() / 2;
        int logicalY = getHeight() / 2 - y;
        
        for (City c : graph.getCities()) {
            int dx = c.getX() - logicalX;
            int dy = c.getY() - logicalY;
            if (dx * dx + dy * dy <= CITY_RADIUS * CITY_RADIUS * 4) {
                return c;
            }
        }
        return null; // ignoring standard clicks for Steiners initially
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        Graphics2D g2d = (Graphics2D) g;
        
        // Enable anti-aliasing
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        int centerX = getWidth() / 2;
        int centerY = getHeight() / 2;
        
        // --- Draw Background Grid ---
        g2d.setColor(new Color(240, 240, 240));
        int spacing = 50;
        
        // vertical grid lines
        for (int x = 0; x <= centerX; x += spacing) {
            g2d.drawLine(centerX + x, 0, centerX + x, getHeight());
            g2d.drawLine(centerX - x, 0, centerX - x, getHeight());
        }
        // horizontal grid lines
        for (int y = 0; y <= centerY; y += spacing) {
            g2d.drawLine(0, centerY + y, getWidth(), centerY + y);
            g2d.drawLine(0, centerY - y, getWidth(), centerY - y);
        }
        
        // Draw Primary Axes (X and Y)
        g2d.setColor(new Color(200, 200, 200));
        g2d.setStroke(new BasicStroke(1.5f));
        g2d.drawLine(centerX, 0, centerX, getHeight()); // Y axis
        g2d.drawLine(0, centerY, getWidth(), centerY); // X axis
        
        // Draw tick numerical labels
        g2d.setColor(Color.GRAY);
        g2d.setFont(new Font("Arial", Font.PLAIN, 10));
        g2d.drawString("(0,0)", centerX + 4, centerY - 4);
        for (int x = spacing; x <= centerX; x += spacing) {
            g2d.drawString(String.valueOf(x), centerX + x - 8, centerY + 12);
            g2d.drawString(String.valueOf(-x), centerX - x - 12, centerY + 12);
        }
        for (int y = spacing; y <= centerY; y += spacing) {
            g2d.drawString(String.valueOf(y), centerX + 4, centerY - y + 4);
            g2d.drawString(String.valueOf(-y), centerX + 4, centerY + y + 4);
        }

        // --- 1. Draw Edges ---
        for (Edge e : graph.getEdges()) {
            City src = graph.getCity(e.getSourceId());
            City tgt = graph.getCity(e.getTargetId());
            
            // For steiner edges, they might connect to virtual/steiner nodes we haven't stored in cities map
            // Need a way to draw them. Currently if steiner nodes are added to city map, it's fine.
            if (src == null || tgt == null) continue;

            if (e.isHighlighted()) {
                g2d.setColor(Color.RED);
                g2d.setStroke(new BasicStroke(3.0f));
            } else if (e.isVirtual()) {
                g2d.setColor(Color.BLUE);
                float[] dash = {10.0f};
                g2d.setStroke(new BasicStroke(2.0f, BasicStroke.CAP_BUTT, BasicStroke.JOIN_MITER, 10.0f, dash, 0.0f));
            } else if (e.isSteiner()) {
                g2d.setColor(Color.ORANGE);
                float[] dash = {5.0f};
                g2d.setStroke(new BasicStroke(2.0f, BasicStroke.CAP_BUTT, BasicStroke.JOIN_MITER, 10.0f, dash, 0.0f));
            } else {
                g2d.setColor(Color.GRAY);
                g2d.setStroke(new BasicStroke(1.5f));
            }

            // Map logical coordinates to screen
            int sx = centerX + src.getX();
            int sy = centerY - src.getY();
            int tx = centerX + tgt.getX();
            int ty = centerY - tgt.getY();

            g2d.drawLine(sx, sy, tx, ty);
            
            // Draw weight near middle
            int mx = (sx + tx) / 2;
            int my = (sy + ty) / 2;
            g2d.setColor(Color.BLACK);
            g2d.setFont(new Font("Arial", Font.PLAIN, 10));
            g2d.drawString(String.valueOf(e.getLength()), mx, my - 5);
        }

        // --- 2. Draw Cities ---
        for (City c : graph.getCities()) {
            int cx = centerX + c.getX();
            int cy = centerY - c.getY();

            if (c.getName().startsWith("Steiner_")) {
                // Steiner points: drawn as small orange squares
                g2d.setColor(Color.ORANGE);
                g2d.fillRect(cx - 4, cy - 4, 8, 8);
            } else {
                // Normal cities: drawn as blue circles
                g2d.setColor(new Color(60, 130, 200));
                g2d.fillOval(cx - CITY_RADIUS, cy - CITY_RADIUS, CITY_RADIUS * 2, CITY_RADIUS * 2);
                
                g2d.setColor(Color.BLACK);
                g2d.drawOval(cx - CITY_RADIUS, cy - CITY_RADIUS, CITY_RADIUS * 2, CITY_RADIUS * 2);
                
                // Name and ID text
                g2d.setFont(new Font("Arial", Font.BOLD, 12));
                g2d.drawString(c.getId() + ":" + c.getName(), cx + CITY_RADIUS + 2, cy + CITY_RADIUS / 2);
            }
        }
    }
}
