// src/components/ImageAdjustModal.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ZoomIn, ZoomOut, RotateCw, RotateCcw, 
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, 
  Check, X, Move, SlidersHorizontal, Sparkles
} from 'lucide-react';
import './ImageAdjustModal.css';

export default function ImageAdjustModal({ isOpen, imageSrc, onCancel, onApply }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const imageRef = useRef(null);
  const viewportRef = useRef(null);
  const previewCanvasRef = useRef(null);

  // Dimensions
  const CROP_SIZE = 260; // Diameter of circular crop window in px

  // Reset state when modal opens with a new image
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      setImageLoaded(false);
      setIsProcessing(false);
    }
  }, [isOpen, imageSrc]);

  // Handle image load to establish base dimensions
  const handleImageLoad = (e) => {
    imageRef.current = e.target;
    setImageLoaded(true);
    setPan({ x: 0, y: 0 });
  };

  // Clamp pan based on image dimensions, zoom, and rotation
  const clampPan = useCallback((newPan, currentZoom, currentRotation) => {
    if (!imageRef.current) return newPan;

    const img = imageRef.current;
    const isRotatedSideways = currentRotation % 180 !== 0;
    const naturalW = isRotatedSideways ? img.naturalHeight : img.naturalWidth;
    const naturalH = isRotatedSideways ? img.naturalWidth : img.naturalHeight;

    const baseScale = Math.max(CROP_SIZE / naturalW, CROP_SIZE / naturalH);
    const currentScale = baseScale * currentZoom;

    const renderedW = naturalW * currentScale;
    const renderedH = naturalH * currentScale;

    const maxPanX = Math.max(0, (renderedW - CROP_SIZE) / 2);
    const maxPanY = Math.max(0, (renderedH - CROP_SIZE) / 2);

    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, newPan.x)),
      y: Math.max(-maxPanY, Math.min(maxPanY, newPan.y)),
    };
  }, []);

  // Update pan with clamping
  const updatePan = useCallback((updater) => {
    setPan(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return clampPan(next, zoom, rotation);
    });
  }, [clampPan, zoom, rotation]);

  // Mouse & Touch Dragging
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newPan = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    };
    setPan(clampPan(newPan, zoom, rotation));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const newPan = {
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    };
    setPan(clampPan(newPan, zoom, rotation));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Mouse Wheel Zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setZoom(prev => {
      const newZoom = Math.min(3, Math.max(1, +(prev + delta).toFixed(2)));
      setPan(currentPan => clampPan(currentPan, newZoom, rotation));
      return newZoom;
    });
  };

  // Directional step buttons
  const handleStepPan = (dx, dy) => {
    updatePan(prev => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  };

  // Zoom Change
  const handleZoomChange = (newZoom) => {
    const clamped = Math.min(3, Math.max(1, newZoom));
    setZoom(clamped);
    setPan(currentPan => clampPan(currentPan, clamped, rotation));
  };

  // Rotate 90 degrees clockwise
  const handleRotate = () => {
    const nextRot = (rotation + 90) % 360;
    setRotation(nextRot);
    setPan(currentPan => clampPan(currentPan, zoom, nextRot));
  };

  // Reset to original center
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  // Live mini preview rendering
  useEffect(() => {
    if (!isOpen || !imageLoaded || !imageRef.current || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const size = 64; // Mini preview size
    canvas.width = size;
    canvas.height = size;

    const img = imageRef.current;
    const isRotatedSideways = rotation % 180 !== 0;
    const naturalW = isRotatedSideways ? img.naturalHeight : img.naturalWidth;
    const naturalH = isRotatedSideways ? img.naturalWidth : img.naturalHeight;

    const baseScale = Math.max(CROP_SIZE / naturalW, CROP_SIZE / naturalH);
    const currentScale = baseScale * zoom;

    ctx.clearRect(0, 0, size, size);

    // Circular clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    // Scale ratio from crop window to mini preview
    const ratio = size / CROP_SIZE;

    ctx.translate(size / 2 + pan.x * ratio, size / 2 + pan.y * ratio);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(currentScale * ratio, currentScale * ratio);

    ctx.drawImage(
      img,
      -img.naturalWidth / 2,
      -img.naturalHeight / 2,
      img.naturalWidth,
      img.naturalHeight
    );

    ctx.restore();
  }, [isOpen, imageLoaded, zoom, rotation, pan]);

  // Generate high-resolution 320x320 circular cropped JPEG
  const handleApply = () => {
    if (!imageRef.current) return;

    setIsProcessing(true);

    try {
      const OUTPUT_SIZE = 320;
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = OUTPUT_SIZE;
      exportCanvas.height = OUTPUT_SIZE;
      const ctx = exportCanvas.getContext('2d');

      const img = imageRef.current;
      const isRotatedSideways = rotation % 180 !== 0;
      const naturalW = isRotatedSideways ? img.naturalHeight : img.naturalWidth;
      const naturalH = isRotatedSideways ? img.naturalWidth : img.naturalHeight;

      const baseScale = Math.max(CROP_SIZE / naturalW, CROP_SIZE / naturalH);
      const currentScale = baseScale * zoom;

      // Ratio between export resolution (320) and viewport crop (260)
      const ratio = OUTPUT_SIZE / CROP_SIZE;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.save();
      // Optional subtle circular background or clean transparent/neutral background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      // Translate to canvas center + scaled pan
      ctx.translate(OUTPUT_SIZE / 2 + pan.x * ratio, OUTPUT_SIZE / 2 + pan.y * ratio);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(currentScale * ratio, currentScale * ratio);

      ctx.drawImage(
        img,
        -img.naturalWidth / 2,
        -img.naturalHeight / 2,
        img.naturalWidth,
        img.naturalHeight
      );

      ctx.restore();

      // Export as crisp JPEG with 0.88 quality (compact for MongoDB)
      const croppedDataUrl = exportCanvas.toDataURL('image/jpeg', 0.88);
      onApply(croppedDataUrl);
    } catch (err) {
      console.error('Failed to export cropped image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  // Calculate transform for the main interactive viewport image
  let imageTransform = '';
  if (imageRef.current) {
    const img = imageRef.current;
    const isRotatedSideways = rotation % 180 !== 0;
    const naturalW = isRotatedSideways ? img.naturalHeight : img.naturalWidth;
    const naturalH = isRotatedSideways ? img.naturalWidth : img.naturalHeight;
    const baseScale = Math.max(CROP_SIZE / naturalW, CROP_SIZE / naturalH);
    const currentScale = baseScale * zoom;

    imageTransform = `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${currentScale})`;
  }

  return (
    <div className="adjust-modal-overlay animate-fade-in" onClick={onCancel}>
      <div 
        className="adjust-modal-card glass-panel" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="adjust-photo-title"
      >
        {/* Header */}
        <div className="adjust-modal-header">
          <div className="adjust-modal-title-box">
            <div className="adjust-icon-badge">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h2 id="adjust-photo-title" className="adjust-modal-title">Adjust Profile Photo</h2>
              <p className="adjust-modal-subtitle">Drag to move • Use slider or arrows to fit perfectly</p>
            </div>
          </div>
          <button 
            type="button" 
            className="adjust-close-btn" 
            onClick={onCancel}
            title="Cancel and close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="adjust-modal-body">
          {/* Viewport Area */}
          <div className="adjust-viewport-column">
            <div 
              ref={viewportRef}
              className={`adjust-viewport ${isDragging ? 'is-dragging' : ''}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
              title="Click and drag to reposition image. Scroll to zoom."
            >
              {/* Image element being transformed */}
              <img
                src={imageSrc}
                alt="Upload preview"
                className="adjust-target-image"
                style={{ transform: imageTransform }}
                onLoad={handleImageLoad}
                draggable={false}
              />

              {/* Dark vignette mask with circular cutout */}
              <div className="adjust-circle-mask">
                {/* Rule of thirds subtle grid lines */}
                <div className="crop-grid-line crop-grid-h1" />
                <div className="crop-grid-line crop-grid-h2" />
                <div className="crop-grid-line crop-grid-v1" />
                <div className="crop-grid-line crop-grid-v2" />
              </div>

              <div className="viewport-drag-hint">
                <Move size={13} />
                <span>Drag to Pan</span>
              </div>
            </div>
          </div>

          {/* Controls Column */}
          <div className="adjust-controls-column">
            {/* Live Preview Avatar */}
            <div className="adjust-preview-panel">
              <div className="preview-avatar-wrapper">
                <canvas ref={previewCanvasRef} className="preview-avatar-canvas" />
                <span className="preview-badge">Live</span>
              </div>
              <div className="preview-label-box">
                <span className="preview-title">Avatar Preview</span>
                <span className="preview-desc">How you'll appear across Food Craft</span>
              </div>
            </div>

            {/* Zoom Slider Control */}
            <div className="adjust-control-card">
              <div className="control-card-header">
                <span className="control-card-label">
                  <ZoomIn size={15} />
                  <span>Zoom Level</span>
                </span>
                <span className="control-card-value">{Math.round(zoom * 100)}%</span>
              </div>
              <div className="zoom-slider-row">
                <button
                  type="button"
                  className="zoom-btn"
                  onClick={() => handleZoomChange(zoom - 0.15)}
                  disabled={zoom <= 1}
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                  className="adjust-zoom-slider"
                  aria-label="Zoom profile image"
                />
                <button
                  type="button"
                  className="zoom-btn"
                  onClick={() => handleZoomChange(zoom + 0.15)}
                  disabled={zoom >= 3}
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
              </div>
            </div>

            {/* Directional Nudge Pad (Left / Right / Up / Down) */}
            <div className="adjust-control-card">
              <div className="control-card-header">
                <span className="control-card-label">
                  <Move size={15} />
                  <span>Position Adjust</span>
                </span>
                <span className="control-card-hint">Fine-tune placement</span>
              </div>
              <div className="dpad-container">
                <button
                  type="button"
                  className="dpad-btn dpad-up"
                  onClick={() => handleStepPan(0, 15)}
                  title="Move Image Down"
                >
                  <ChevronUp size={18} />
                </button>
                <div className="dpad-middle-row">
                  <button
                    type="button"
                    className="dpad-btn dpad-left"
                    onClick={() => handleStepPan(15, 0)}
                    title="Move Image Right"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="dpad-center-dot" />
                  <button
                    type="button"
                    className="dpad-btn dpad-right"
                    onClick={() => handleStepPan(-15, 0)}
                    title="Move Image Left"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
                <button
                  type="button"
                  className="dpad-btn dpad-down"
                  onClick={() => handleStepPan(0, -15)}
                  title="Move Image Up"
                >
                  <ChevronDown size={18} />
                </button>
              </div>
            </div>

            {/* Quick Actions (Rotate & Reset) */}
            <div className="adjust-quick-actions">
              <button
                type="button"
                className="adjust-tool-btn"
                onClick={handleRotate}
                title="Rotate image 90 degrees clockwise"
              >
                <RotateCw size={15} />
                <span>Rotate 90°</span>
              </button>
              <button
                type="button"
                className="adjust-tool-btn"
                onClick={handleReset}
                title="Reset zoom and position"
              >
                <RotateCcw size={15} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="adjust-modal-footer">
          <button
            type="button"
            className="btn-secondary adjust-cancel-btn"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary btn-glow adjust-apply-btn"
            onClick={handleApply}
            disabled={!imageLoaded || isProcessing}
          >
            <Check size={17} />
            <span>{isProcessing ? 'Saving...' : 'Apply & Save Photo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
