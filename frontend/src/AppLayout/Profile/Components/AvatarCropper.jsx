import { useState, useRef, useEffect } from 'react';

const AvatarCropper = ({ initialImage, onSave, onClose }) => {
  const [image, setImage] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const imageRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('File size exceeds 2MB limit');
        return;
      }
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
        setError(null);
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!image || isLoading) {
      setError('Please wait while image loads...');
      return;
    }

    try {
      // Create canvas for cropped output
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Set canvas size to desired avatar size
      const avatarSize = 400; // Increased resolution
      canvas.width = avatarSize;
      canvas.height = avatarSize;

      const img = new Image();
      img.src = image;
      await new Promise((resolve) => { img.onload = resolve; });

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create circular clipping path
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarSize / 2, avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();

      // Calculate aspect ratio for proper drawing
      const imgAspect = img.width / img.height;
      const canvasAspect = avatarSize / avatarSize;

      let drawX, drawY, drawWidth, drawHeight;

      if (imgAspect > canvasAspect) {
        drawWidth = avatarSize * imgAspect;
        drawHeight = avatarSize;
        drawX = -(drawWidth - avatarSize) / 2;
        drawY = 0;
      } else {
        drawWidth = avatarSize;
        drawHeight = avatarSize / imgAspect;
        drawX = 0;
        drawY = -(drawHeight - avatarSize) / 2;
      }

      // Draw the image centered
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      // Convert to data URL
      const croppedImageData = canvas.toDataURL('image/jpeg', 0.9);
      onSave(croppedImageData);
    } catch (err) {
      console.error('Error cropping image:', err);
      setError('Failed to crop image. Please try again.');
    }
  };

  const backdropClass = "fixed inset-0 z-[100] flex items-center justify-center bg-[#050508]/80 backdrop-blur-sm p-4 animate-in fade-in duration-300";
  const modalClass = "rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300";
  const modalContentStyle = {
    background: 'rgba(12,13,20,0.95)',
    border: '1px solid rgba(30,34,51,0.8)'
  };

  if (!image) {
    return (
      <div className={backdropClass}>
        <div className={modalClass} style={modalContentStyle}>
          <div className="p-6">
            <h3
              className="font-display text-xl font-bold text-slate-100 mb-2 pb-4 border-b border-phantom"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Update Biometrics
            </h3>
            <p
              className="font-mono text-xs text-slate-400 mb-6"
              style={{ fontFamily: 'monospace' }}
            >
              Upload a new identification image. Supported formats: PNG, JPEG (Max 2MB).
            </p>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-toxic border-t-transparent mb-4"></div>
                <p className="font-mono text-xs text-slate-500 uppercase tracking-widest">Processing scan...</p>
              </div>
            ) : (
              <div className="group relative">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-lg transition-all"
                  style={{
                    borderColor: 'rgba(30,34,51,0.8)',
                    background: 'rgba(12,13,20,0.5)'
                  }}
                >
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                    style={{ background: 'rgba(34,197,94,0.1)' }}
                  >
                    <svg className="w-8 h-8" fill="none" stroke="#22C55E" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="font-display font-bold text-slate-100 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Select Image File
                  </p>
                  <p className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">or drag and drop here</p>
                </label>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 rounded-lg flex items-center gap-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-mono text-xs text-red-400" style={{ fontFamily: 'monospace' }}>{error}</p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg font-mono text-xs uppercase tracking-wider transition-colors"
                style={{
                  color: '#94a3b8'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={backdropClass}>
      <div className={modalClass} style={modalContentStyle}>
        <div className="p-6">
          <h3
            className="font-display text-xl font-bold text-slate-100 mb-6 pb-4 border-b border-phantom"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Confirm Crop
          </h3>

          <div
            className="relative aspect-square mb-6 rounded-lg overflow-hidden flex items-center justify-center"
            style={{ border: '1px solid rgba(30,34,51,0.8)', background: 'rgba(12,13,20,0.8)' }}
          >
            <img
              ref={imageRef}
              src={image}
              alt="Crop preview"
              className="max-w-full max-h-full object-contain"
            />
            {/* Circular Mask Overlay */}
            <div className="absolute inset-0 border-[40px] border-[#0c0d10]/60 pointer-events-none">
              <div className="w-full h-full rounded-full border-2 border-toxic/50 ring-[1000px] border-[#0c0d10]/60"></div>
            </div>
          </div>

          <div
            className="flex items-center gap-4 p-4 rounded-lg mb-6"
            style={{ background: 'rgba(12,13,20,0.8)', border: '1px solid rgba(30,34,51,0.8)' }}
          >
            <div
              className="w-12 h-12 rounded-full overflow-hidden border-2"
              style={{ border: '2px solid #22C55E' }}
            >
              <div
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${image})` }}
              />
            </div>
            <div>
              <p className="font-display font-bold text-slate-100" style={{ fontFamily: 'Inter, sans-serif' }}>Biometric Preview</p>
              <p className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">Circular Output</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg flex items-center gap-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-mono text-xs text-red-400" style={{ fontFamily: 'monospace' }}>{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setImage(null)}
              className="px-5 py-2.5 rounded-lg font-mono text-xs uppercase tracking-wider transition-colors"
              style={{
                color: '#94a3b8'
              }}
            >
              Back
            </button>
            <button
              onClick={handleSave}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-display text-sm font-bold uppercase tracking-wider transition-all"
              style={{
                background: '#22C55E',
                color: '#0c0d10',
                border: '1px solid rgba(34,197,94,0.3)'
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Finalize Scan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarCropper;
