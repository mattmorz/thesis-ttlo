"use client";

import Script from "next/script";

/**
 * LayoutDetector Component
 *
 * This component adds a script to the page that can detect layout rendering issues
 * before React components have a chance to mount.
 *
 * It provides an early detection system for broken layouts without affecting
 * the normal functionality of the application.
 */
export function LayoutDetector() {
  return (
    <Script
      id="layout-detector"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            // Function to detect broken layout
            function detectBrokenLayout() {
              // Allow time for DOM to render
              setTimeout(function() {
                // Check if the page has rendered properly
                const hasSideNav = document.querySelectorAll('header').length > 0;
                const hasMainContent = document.querySelectorAll('main').length > 0 || 
                                      document.querySelectorAll('.container > div:not(nav)').length > 1;
                
                // If we have side nav but no main content, layout is likely broken
                if (hasSideNav && !hasMainContent) {
                  console.log('Layout detector: Early detection of broken layout, reloading page');
                  // Set a flag to prevent infinite reloads
                  if (!sessionStorage.getItem('layoutReloaded_' + window.location.pathname)) {
                    sessionStorage.setItem('layoutReloaded_' + window.location.pathname, '1');
                    window.location.reload();
                  } else {
                    // If we've already reloaded once, clear the flag after 5 seconds
                    setTimeout(function() {
                      sessionStorage.removeItem('layoutReloaded_' + window.location.pathname);
                    }, 5000);
                  }
                }
              }, 1000);
            }
            
            // Detect broken layout on page load
            window.addEventListener('DOMContentLoaded', detectBrokenLayout);
            
            // Also detect on navigation events
            window.addEventListener('popstate', detectBrokenLayout);
          })();
        `,
      }}
    />
  );
}

export default LayoutDetector;
