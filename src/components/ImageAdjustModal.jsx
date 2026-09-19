// src/components/ImageAdjustModal.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCw, RotateCcw, X, Check } from 'lucide-react';
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
  const CROP_SIZE = 220; // Normal compact circular crop window

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      setImageLoaded(false);
      setIsProcessing(false);
    }
  }, [isOpen, imageSrc]);

  const handleImageLoad = (e) => {
    imageRef.current = e.target;
    setImageLoaded(true);
    setPan({ x: 0, y: 0 });
  };

  // Clamp pan so image always covers the circle
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

  // Mouse drag handlers
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

  // Touch drag handlers for mobile
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

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.002;
    setZoom(prev => {
      const newZoom = Math.min(3, Math.max(1, +(prev + delta).toFixed(2)));
      setPan(currentPan => clampPan(currentPan, newZoom, rotation));
      return newZoom;
    });
  };

  const handleZoomChange = (newZoom) => {
    const clamped = Math.min(3, Math.max(1, newZoom));
    setZoom(clamped);
    setPan(currentPan => clampPan(currentPan, clamped, rotation));
  };

  const handleRotate = () => {
    const nextRot = (rotation + 90) % 360;
    setRotation(nextRot);
    setPan(currentPan => clampPan(currentPan, zoom, nextRot));
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  const handleApply = () => {
    if (!imageRef.current) return;
    setIsProcessing(true);

    try {
      const OUTPUT_SIZE = 320;
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');

      const img = imageRef.current;
      const isRotatedSideways = rotation % 180 !== 0;
      const naturalW = isRotatedSideways ? img.naturalHeight : img.naturalWidth;
      const naturalH = isRotatedSideways ? img.naturalWidth : img.naturalHeight;

      const baseScale = Math.max(CROP_SIZE / naturalW, CROP_SIZE / naturalH);
      const currentScale = baseScale * zoom;
      const ratio = OUTPUT_SIZE / CROP_SIZE;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

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

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
      onApply(croppedDataUrl);
    } catch (err) {
      console.error('Crop export failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

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
      >
        {/* Header */}
        <div className="adjust-modal-header">
          <span className="adjust-modal-title">Adjust Profile Photo</span>
          <button 
            type="button" 
            className="adjust-close-btn" 
            onClick={onCancel}
            title="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Circular Interactive Crop View */}
        <div className="adjust-viewport-wrapper">
          <div 
            className={`adjust-viewport ${isDragging ? 'is-dragging' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            title="Drag to reposition (left, right, up, down)"
          >
            <img
              src={imageSrc}
              alt="Crop target"
              className="adjust-target-image"
              style={{ transform: imageTransform }}
              onLoad={handleImageLoad}
              draggable={false}
            />
            {/* Circular mask with border */}
            <div className="adjust-circle-mask" />
          </div>
          <span className="adjust-drag-hint">Drag image to position</span>
        </div>

        {/* Clean Zoom Slider */}
        <div className="adjust-controls-box">
          <div className="zoom-row">
            <button
              type="button"
              className="zoom-step-btn"
              onClick={() => handleZoomChange(zoom - 0.2)}
              disabled={zoom <= 1}
              title="Zoom out"
            >
              <ZoomOut size={15} />
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="adjust-zoom-slider"
              aria-label="Zoom"
            />
            <button
              type="button"
              className="zoom-step-btn"
              onClick={() => handleZoomChange(zoom + 0.2)}
              disabled={zoom >= 3}
              title="Zoom in"
            >
              <ZoomIn size={15} />
            </button>
          </div>

          {/* Rotate & Reset quick buttons */}
          <div className="tools-row">
            <button
              type="button"
              className="tool-btn"
              onClick={handleRotate}
              title="Rotate 90°"
            >
              <RotateCw size={14} />
              <span>Rotate</span>
            </button>
            <button
              type="button"
              className="tool-btn"
              onClick={handleReset}
              title="Reset position"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="adjust-modal-footer">
          <button
            type="button"
            className="btn-secondary adjust-btn-cancel"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary btn-glow adjust-btn-apply"
            onClick={handleApply}
            disabled={!imageLoaded || isProcessing}
          >
            <Check size={16} />
            <span>{isProcessing ? 'Saving...' : 'Save Photo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
