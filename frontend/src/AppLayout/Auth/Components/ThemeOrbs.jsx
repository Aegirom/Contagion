import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * ThemeOrbs - Animated gradient orb backgrounds for auth pages
 * 
 * @param {Array} orbs - Array of orb configurations with color, position, rotation, etc.
 * @param {React.Ref} containerRef - Reference to canvas element
 * 
 * Orb config example:
 * { x: 0.15, y: 0.25, r: 0.5, color: [34, 197, 94], angle: 0, speed: 0.0004, sineX: 0.15, cosY: 0.71, cosX: 0.12 }
 */
const ThemeOrbs = ({ orbs, containerRef }) => {
  const animationFrameRef = useRef(null);
  const canvasContextRef = useRef(null);

  // Gradient opacity stops - tune these for visual effect
  const GRADIENT_CONFIG = {
    centerOpacity: 0.03,
    midOpacity: 0.01,
    edgeOpacity: 0,
  };

  /**
   * Handle canvas resize to match window dimensions
   */
  const handleCanvasResize = useCallback(() => {
    const canvas = containerRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, [containerRef]);

  /**
   * Create radial gradient for a single orb
   */
  const createOrbGradient = useCallback((ctx, centerX, centerY, radius, rgbColor) => {
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    
    gradient.addColorStop(0, `rgba(${rgbColor},${GRADIENT_CONFIG.centerOpacity})`);
    gradient.addColorStop(0.5, `rgba(${rgbColor},${GRADIENT_CONFIG.midOpacity})`);
    gradient.addColorStop(1, `rgba(${rgbColor},${GRADIENT_CONFIG.edgeOpacity})`);
    
    return gradient;
  }, []);

  /**
   * Calculate current position of orb based on animation
   */
  const calculateOrbPosition = useCallback((orb, canvasWidth, canvasHeight) => {
    const xOffset = Math.sin(orb.angle) * orb.sineX;
    const yOffset = Math.cos(orb.angle * orb.cosY) * orb.cosX;
    
    const centerX = (orb.x + xOffset) * canvasWidth;
    const centerY = (orb.y + yOffset) * canvasHeight;
    const radius = orb.r * Math.min(canvasWidth, canvasHeight);
    
    return { centerX, centerY, radius };
  }, []);

  /**
   * Draw all orbs on canvas
   */
  const drawOrbs = useCallback((ctx, canvasWidth, canvasHeight) => {
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw each orb
    orbs.forEach((orb) => {
      // Update animation angle
      orb.angle += orb.speed;

      // Calculate position
      const { centerX, centerY, radius } = calculateOrbPosition(
        orb,
        canvasWidth,
        canvasHeight
      );

      // Create and apply gradient
      const gradient = createOrbGradient(ctx, centerX, centerY, radius, orb.color);
      ctx.fillStyle = gradient;

      // Draw circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [orbs, calculateOrbPosition, createOrbGradient]);

  /**
   * Animation loop
   */
  const animate = useCallback(() => {
    const canvas = containerRef.current;
    const ctx = canvasContextRef.current;

    if (!canvas || !ctx) {
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }

    drawOrbs(ctx, canvas.width, canvas.height);
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [containerRef, drawOrbs]);

  /**
   * Initialize canvas and animation
   */
  useEffect(() => {
    const canvas = containerRef.current;
    if (!canvas) return;

    // Get canvas context
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    canvasContextRef.current = ctx;

    // Initial resize
    handleCanvasResize();

    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);

    // Add resize listener
    window.addEventListener('resize', handleCanvasResize);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleCanvasResize);
      canvasContextRef.current = null;
    };
  }, [containerRef, animate, handleCanvasResize]);

  return (
    <canvas
      ref={containerRef}
      className="absolute inset-0 pointer-events-none bg-transparent"
      style={{ willChange: 'transform' }}
    />
  );
};

export default ThemeOrbs;
