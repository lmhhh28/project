package com.citygraph.view;

import javax.swing.*;
import java.awt.*;

/**
 * A standalone window for displaying system log output.
 */
public class LogWindow extends JFrame {
    private JTextArea outputArea;

    public LogWindow(JFrame owner) {
        super("系统日志输出");
        this.setSize(400, 300);
        this.setDefaultCloseOperation(JFrame.HIDE_ON_CLOSE);

        // Optional: positioning relative to main window
        if (owner != null) {
            Point location = owner.getLocation();
            this.setLocation(location.x + owner.getWidth(), location.y);
        }

        outputArea = new JTextArea();
        outputArea.setEditable(false);
        outputArea.setLineWrap(true);
        outputArea.setWrapStyleWord(true);
        
        JScrollPane scrollPane = new JScrollPane(outputArea);
        scrollPane.setBorder(BorderFactory.createEmptyBorder(5, 5, 5, 5));
        
        this.getContentPane().add(scrollPane, BorderLayout.CENTER);
    }

    public void log(String msg) {
        outputArea.append("- " + msg + "\n");
        // Auto scroll to bottom
        outputArea.setCaretPosition(outputArea.getDocument().getLength());
    }
    
    public void clear() {
        outputArea.setText("");
    }
}
