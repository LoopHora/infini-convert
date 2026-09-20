// ===== APP COMPONENT & ROUTING =====

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header, Footer } from '@/components/Layout';
import { HomePage } from '@/pages/Home';

const ConvertPage = lazy(() => import('@/pages/Convert').then(m => ({ default: m.ConvertPage })));
const CompressPage = lazy(() => import('@/pages/Compress').then(m => ({ default: m.CompressPage })));
const ResizePage = lazy(() => import('@/pages/Resize').then(m => ({ default: m.ResizePage })));
const ImageToPdfPage = lazy(() => import('@/pages/ImageToPdf').then(m => ({ default: m.ImageToPdfPage })));
const PdfToImagePage = lazy(() => import('@/pages/PdfToImage').then(m => ({ default: m.PdfToImagePage })));
const PowerPointPage = lazy(() => import('@/pages/PowerPoint').then(m => ({ default: m.PowerPointPage })));
const PrivacyPage = lazy(() => import('@/pages/Privacy').then(m => ({ default: m.PrivacyPage })));
const AboutPage = lazy(() => import('@/pages/About').then(m => ({ default: m.AboutPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFound').then(m => ({ default: m.NotFoundPage })));

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>Loading...</div>}>
          <Routes>
            {/* Home */}
            <Route path="/" element={<HomePage />} />

            {/* Dedicated PowerPoint routes */}
            <Route path="/powerpoint" element={<PowerPointPage />} />
            <Route path="/powerpoint/:toolId" element={<PowerPointPage />} />
            <Route path="/convert/pptx-to-pdf" element={<PowerPointPage initialMode="pdf" />} />
            <Route path="/convert/pptx-to-png" element={<PowerPointPage initialMode="png" />} />
            <Route path="/convert/pptx-to-jpg" element={<PowerPointPage initialMode="jpg" />} />
            <Route path="/convert/pptx-to-text" element={<PowerPointPage initialMode="text" />} />

            {/* Dedicated PDF routes (must precede generic :toolId) */}
            <Route path="/convert/image-to-pdf" element={<ImageToPdfPage />} />
            <Route path="/convert/pdf-to-jpg" element={<PdfToImagePage initialFormat="jpg" />} />
            <Route path="/convert/pdf-to-png" element={<PdfToImagePage initialFormat="png" />} />

            {/* Dedicated redirects for tool alias routes */}
            <Route path="/convert/resize-image" element={<Navigate to="/resize/image" replace />} />
            <Route path="/convert/resize" element={<Navigate to="/resize/image" replace />} />
            <Route path="/convert/crop-image" element={<Navigate to="/resize/image?mode=crop" replace />} />
            <Route path="/convert/crop" element={<Navigate to="/resize/image?mode=crop" replace />} />
            <Route path="/convert/pptx" element={<Navigate to="/powerpoint" replace />} />
            <Route path="/convert/powerpoint" element={<Navigate to="/powerpoint" replace />} />

            {/* Image format conversion */}
            <Route path="/convert/:toolId" element={<ConvertPage />} />
            <Route path="/convert" element={<Navigate to="/convert/jpg-to-png" replace />} />

            {/* Image compression */}
            <Route path="/compress/:format" element={<CompressPage />} />
            <Route path="/compress" element={<Navigate to="/compress/image" replace />} />

            {/* Image resize & crop */}
            <Route path="/resize/image" element={<ResizePage />} />
            <Route path="/resize" element={<Navigate to="/resize/image" replace />} />
            <Route path="/crop/image" element={<Navigate to="/resize/image?mode=crop" replace />} />
            <Route path="/crop" element={<Navigate to="/resize/image?mode=crop" replace />} />

            {/* Static informational pages */}
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/about" element={<AboutPage />} />

            {/* 404 Catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
