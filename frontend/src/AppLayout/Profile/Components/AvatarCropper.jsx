import { useState, useRef, useEffect, useCallback } from 'react';

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
      const avatarSize = 200;
      canvas.width = avatarSize;
      canvas.height = avatarSize;

      const img = new Image();
      img.src = image;
      await new Promise((resolve) => { img.onload = resolve; });

      // Clear canvas with background color
      ctx.fillStyle = '#0a0b10';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Create circular clipping path and draw image
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
        drawWidth = avatarSize;
        drawHeight = avatarSize / imgAspect;
        drawX = 0;
        drawY = (avatarSize - drawHeight) / 2;
      } else {
        drawHeight = avatarSize;
        drawWidth = avatarSize * imgAspect;
        drawX = (avatarSize - drawWidth) / 2;
        drawY = 0;
      }

      // Draw the image centered on the canvas
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      // Convert to data URL
      const croppedImageData = canvas.toDataURL('image/jpeg', 0.9);
      onSave(croppedImageData);
    } catch (err) {
      console.error('Error cropping image:', err);
      setError('Failed to crop image. Please try again.');
    }
  };

  if (!image) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
        <div className="bg-[#0a0b10] rounded-2xl p-6 max-w-md w-full" style={{ border: '1px solid rgba(30,34,51,0.7)' }}>
          <h3 className="font-display text-xl font-bold text-white mb-4">Upload Avatar</h3>
          <p className="text-[#475569] mb-6 text-sm">Select a PNG, JPEG, or JPG image to set your profile picture</p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#22C55E] border-t-transparent"></div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-[#1E2233] rounded-xl p-8 text-center mb-6">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
                className="hidden"
                id="avatar-upload"
              />
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer flex flex-col items-center justify-center py-8"
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(30,34,51,0.7)'; }}
              >
                <div className="w-16 h-16 rounded-full bg-[#1E2233] flex items-center justify-center mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
                    <path d="M21 19v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
                    <path d="M18 2v2" />
                    <path d="M12 2v2" />
                    <path d="M6 2v2" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </div>
                <p className="text-[#94A3B8] font-medium mb-2">Click to select image</p>
                <p className="text-[#64748B] text-xs">PNG, JPEG, JPG up to 2MB</p>
              </label>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium text-[#64748B] hover:text-[#94A3B8] transition-colors"
              onMouseEnter={(e) => { e.currentTarget.style.color = '#94A3B8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B'; }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#0a0b10] rounded-2xl p-6 max-w-md w-full flex flex-col" style={{ border: '1px solid rgba(30,34,51,0.7)' }}>
        <h3 className="font-display text-xl font-bold text-white mb-6">Crop Your Avatar</h3>

        <div className="relative w-full aspect-square mb-6 rounded-lg overflow-hidden border-2 border-[#1E2233] bg-[#0a0a0f] flex items-center justify-center">
          <img
            ref={imageRef}
            src={image}
            alt="Crop"
            className="max-w-full max-h-full object-contain"
            crossOrigin="anonymous"
          />
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#22C55E] bg-[#0a0a0f]">
              <div
                className="w-full h-full bg-cover bg-center rounded-full"
                style={{ backgroundImage: `url(${image})` }}
              />
            </div>
            <div className="text-xs text-[#64748B]">
              <p className="font-medium">Circular Preview</p>
            </div>
          </div>
          <span className="text-xs text-[#64748B]">200x200px</span>
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3 mt-auto">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium text-[#64748B] hover:text-[#94A3B8] transition-colors"
            onMouseEnter={(e) => { e.currentTarget.style.color = '#94A3B8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B'; }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-lg font-medium bg-[#22C55E] text-[#0a0b10] hover:bg-[#4ade80] transition-colors"
          >
            Save Avatar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarCropper;
