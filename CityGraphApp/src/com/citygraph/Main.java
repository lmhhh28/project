package com.citygraph;

import com.citygraph.view.MainFrame;

import javax.swing.*;

public class Main {
    public static void main(String[] args) {
        // Enable HiDPI support for Windows and Linux before initializing UI
        System.setProperty("sun.java2d.dpiaware", "true");
        System.setProperty("swing.aatext", "true");
        System.setProperty("awt.useSystemAAFontSettings", "on");
        
        // Set cross-platform look and feel
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception e) {
            e.printStackTrace();
        }

        SwingUtilities.invokeLater(() -> {
            MainFrame frame = new MainFrame();
            frame.setLocationRelativeTo(null);
            frame.setVisible(true);
        });
    }
}
