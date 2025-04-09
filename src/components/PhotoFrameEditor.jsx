'use client';
import { useEffect, useRef, useState } from 'react';
import { Group, Image as KonvaImage, Layer, Stage, Transformer } from 'react-konva';
import useImage from 'use-image';

const frameList = ['/fb-frame-final.png'];

export default function PhotoFrameEditor() {
  const [userImage, setUserImage] = useState(null);
  const [userImgObj, setUserImgObj] = useState(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [frameImage] = useImage(frameList[frameIndex]);

  const [canvasSize, setCanvasSize] = useState(300); // Default mobile size
  const [isMobile, setIsMobile] = useState(true);

  const stageRef = useRef();
  const userImageRef = useRef();
  const trRef = useRef();
  const layerRef = useRef();
  const containerRef = useRef();

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new window.Image();
      img.src = event.target.result;
      img.onload = () => {
        setUserImage(img.src);
        setUserImgObj(img);
      };
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    const resizeCanvas = () => {
      if (containerRef.current) {
        checkIfMobile();
        const containerWidth = containerRef.current.offsetWidth;
        // On mobile, take full width minus padding, on desktop limit to 512px
        const size = isMobile
          ? containerWidth - 32 // accounting for padding
          : Math.min(containerWidth, 512);
        setCanvasSize(size);
      }
    };

    // Initial setup
    checkIfMobile();
    resizeCanvas();

    // Add event listeners
    window.addEventListener('resize', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isMobile]);

  useEffect(() => {
    if (userImgObj && userImageRef.current) {
      trRef.current.nodes([userImageRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [userImgObj]);

  const handleDownload = () => {
    trRef.current.nodes([]);
    layerRef.current.batchDraw();

    const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = 'framed-image.png';
    link.href = uri;
    link.click();

    if (userImageRef.current) {
      trRef.current.nodes([userImageRef.current]);
      layerRef.current.batchDraw();
    }
  };

  const scale = canvasSize / 512;

  return (
    <div
      ref={containerRef}
      className="w-full max-w-md mx-auto p-4 flex flex-col items-center gap-4"
      style={{
        width: '100%',
        maxWidth: '100vw',
        boxSizing: 'border-box'
      }}
    >
      <label
        htmlFor="file-upload"
        className="bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-700 transition duration-200 text-sm sm:text-base w-full sm:w-auto text-center"
      >
        {userImage ? 'Change Image' : 'Upload Image'}
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
      </label>

      <div
        className="relative"
        style={{
          width: canvasSize,
          height: canvasSize,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '1px solid #ccc',
          maxWidth: '100%',
          aspectRatio: '1/1'
        }}
      >
        <Stage
          width={canvasSize}
          height={canvasSize}
          ref={stageRef}
          className="block"
        >
          <Layer ref={layerRef}>
            <Group
              clipFunc={(ctx) => {
                ctx.beginPath();
                ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, Math.PI * 2, false);
                ctx.closePath();
              }}
            >
              {userImage && (
                <>
                  <KonvaImage
                    image={userImgObj}
                    x={56 * scale}
                    y={56 * scale}
                    width={400 * scale}
                    height={400 * scale}
                    draggable
                    ref={userImageRef}
                  />
                  <Transformer
                    ref={trRef}
                    rotateEnabled={true}
                    enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                    boundBoxFunc={(oldBox, newBox) => {
                      if (newBox.width < 50 * scale || newBox.height < 50 * scale) {
                        return oldBox;
                      }
                      return newBox;
                    }}
                    borderStrokeWidth={1 * scale}
                    anchorStrokeWidth={1 * scale}
                    anchorSize={8 * scale}
                  />
                </>
              )}
            </Group>

            {frameImage && (
              <KonvaImage
                image={frameImage}
                x={0}
                y={0}
                width={canvasSize}
                height={canvasSize}
                listening={false}
              />
            )}
          </Layer>
        </Stage>
      </div>

      {userImage && (
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 text-sm sm:text-base w-full sm:w-auto"
        >
          Save Image
        </button>
      )}
    </div>
  );
}
