import { useState, useEffect, useRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Download, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';
import type { PDFPageProxy } from 'pdfjs-dist';

// Configure PDF.js worker locally (Vite)
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

interface FlipbookViewerProps {
  pdfUrl: string;
  title?: string;
  onClose?: () => void;
}

export const FlipbookViewer = ({ pdfUrl, title, onClose }: FlipbookViewerProps) => {
  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const bookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Base dimensions for the flipbook
  const BASE_WIDTH = 550;
  const BASE_HEIGHT = 733;

  useEffect(() => {
    loadPDF();
  }, [pdfUrl]);

  const loadPDF = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      
      if (numPages === 0) {
        throw new Error('PDF has no pages');
      }
      
      setTotalPages(numPages);

      const pageImages: string[] = [];
      
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page: PDFPageProxy = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas,
          }).promise;

          pageImages.push(canvas.toDataURL());
        }
      }

      if (pageImages.length === 0) {
        throw new Error('Failed to render any pages from the PDF');
      }

      setPages(pageImages);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load PDF';
      setError(`Unable to load flipbook: ${errorMessage}. Please check the PDF file or try again.`);
      setIsLoading(false);
    }
  };

  const handlePrevPage = () => {
    if (bookRef.current) {
      bookRef.current.pageFlip().flipPrev();
    }
  };

  const handleNextPage = () => {
    if (bookRef.current) {
      bookRef.current.pageFlip().flipNext();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = title || 'flipbook.pdf';
    link.click();
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2.0));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading flipbook...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center max-w-md">
          <div className="rounded-full bg-destructive/10 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Failed to Load Flipbook</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={loadPDF} variant="outline">
              Try Again
            </Button>
            {onClose && (
              <Button onClick={onClose} variant="default">
                Close
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (pages.length === 0 || totalPages === 0) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center max-w-md">
          <div className="rounded-full bg-muted p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <X className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Pages Found</h3>
          <p className="text-muted-foreground mb-4">
            This flipbook appears to be empty or the PDF could not be processed correctly.
          </p>
          {onClose && (
            <Button onClick={onClose} variant="default">
              Close
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flipbook-container relative bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-2xl font-bold">{title || 'Flipbook'}</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5}
              className="h-8 w-8"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[3.5rem] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleZoomIn}
              disabled={zoomLevel >= 2.0}
              className="h-8 w-8"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            {zoomLevel !== 1.0 && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleResetZoom}
                className="h-8 w-8"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button variant="outline" size="icon" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          {onClose && (
            <Button variant="outline" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Flipbook */}
      <div className="flex items-center justify-center p-8 min-h-[600px] overflow-auto">
        <HTMLFlipBook
          key={`flipbook-${zoomLevel}`}
          ref={bookRef}
          width={Math.round(BASE_WIDTH * zoomLevel)}
          height={Math.round(BASE_HEIGHT * zoomLevel)}
          size="stretch"
          minWidth={Math.round(315 * zoomLevel)}
          maxWidth={Math.round(1000 * zoomLevel)}
          minHeight={Math.round(400 * zoomLevel)}
          maxHeight={Math.round(1533 * zoomLevel)}
          maxShadowOpacity={0.5}
          showCover={true}
          mobileScrollSupport={true}
          onFlip={(e: any) => setCurrentPage(e.data)}
          className="flipbook"
          startPage={currentPage}
          drawShadow={true}
          flippingTime={1000}
          usePortrait={true}
          startZIndex={0}
          autoSize={false}
          clickEventForward={true}
          useMouseEvents={true}
          swipeDistance={30}
          showPageCorners={true}
          disableFlipByClick={false}
          style={{}}
        >
          {pages.map((page, index) => (
            <div key={index} className="page">
              <Card className="h-full w-full overflow-hidden">
                <img
                  src={page}
                  alt={`Page ${index + 1}`}
                  className="w-full h-full object-contain"
                />
              </Card>
            </div>
          ))}
        </HTMLFlipBook>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 p-4 border-t">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevPage}
          disabled={currentPage === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <span className="text-sm text-muted-foreground">
          Page {currentPage + 1} of {totalPages}
        </span>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNextPage}
          disabled={currentPage >= totalPages - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
