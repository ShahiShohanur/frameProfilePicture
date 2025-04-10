'use client';
import { useEffect, useRef, useState } from 'react';
import { Group, Image as KonvaImage, Layer, Stage, Transformer } from 'react-konva';
import useImage from 'use-image';

const frameList = ['/fb-frame-final-max-1200.png'];

export default function PhotoFrameEditor() {
  const [userImage, setUserImage] = useState(null);
  const [userImgObj, setUserImgObj] = useState(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [frameImage] = useImage(frameList[frameIndex]);

  const [canvasSize, setCanvasSize] = useState(300); // Default mobile size
  const [isMobile, setIsMobile] = useState(true);
  const [scaleFactor, setScaleFactor] = useState(1); // Scale factor for the image
  const [aspectRatio, setAspectRatio] = useState(1); // Store the image's aspect ratio

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
        setAspectRatio(img.width / img.height); // Set the aspect ratio
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

  // Handle scaling from the slider
  const handleScaleChange = (e) => {
    setScaleFactor(e.target.value);
  };

  // Calculate the image width and height based on the scale factor and aspect ratio
  const imageWidth = 670 * scaleFactor * scale * aspectRatio; // previous value 400
  const imageHeight = 670 * scaleFactor * scale; // previous value 400

  return (
    <div
      ref={containerRef}
      className='w-full max-w-md mx-auto p-4 flex flex-col items-center gap-4'
      style={{
        width: '100%',
        maxWidth: '100vw',
        boxSizing: 'border-box',
      }}>
      <label
        htmlFor='file-upload'
        className='bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-700 transition duration-200 text-sm sm:text-base w-full sm:w-auto text-center'>
        {userImage ? 'Change Image' : 'Upload Image'}
        <input id='file-upload' type='file' accept='image/*' onChange={handleUpload} className='hidden' />
      </label>

      <div
        className='relative'
        style={{
          width: canvasSize,
          height: canvasSize,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '1px solid #ccc',
          maxWidth: '100%',
          aspectRatio: '1/1',
        }}>
        <Stage width={canvasSize} height={canvasSize} ref={stageRef} className='block'>
          <Layer ref={layerRef}>
            <Group
              clipFunc={(ctx) => {
                ctx.beginPath();
                ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, Math.PI * 2, false);
                ctx.closePath();
              }}>
              {userImage && (
                <>
                  <KonvaImage
                    image={userImgObj}
                    x={(canvasSize - imageWidth) / 2} // Center the image horizontally
                    y={(canvasSize - imageHeight) / 2} // Center the image vertically
                    width={imageWidth} // Use the calculated width
                    height={imageHeight} // Use the calculated height
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
              <KonvaImage image={frameImage} x={0} y={0} width={canvasSize} height={canvasSize} listening={false} />
            )}
          </Layer>
        </Stage>
      </div>

      {userImage && (
        <div className='w-full mt-4'>
          <label htmlFor='image-scale' className='text-sm font-medium'>
            Adjust Image Size:
          </label>
          <input
            id='image-scale'
            type='range'
            min='0.5'
            max='2'
            step='0.01'
            value={scaleFactor}
            onChange={handleScaleChange}
            className='w-full mt-2'
          />
          <div className='text-sm text-center'>Scale: {Math.round(scaleFactor * 100)}%</div>
        </div>
      )}

      {userImage && (
        <button
          onClick={handleDownload}
          className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 text-sm sm:text-base w-full sm:w-auto'>
          Save Image
        </button>
      )}
    </div>
  );
}
