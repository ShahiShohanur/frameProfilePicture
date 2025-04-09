"use client"
import { useEffect, useRef, useState } from 'react';
import { Group, Image as KonvaImage, Layer, Stage, Transformer } from 'react-konva';
import useImage from 'use-image';

const frameList = [
  '/fb-frame-final.png',
  // '/Frame-PNG-Photo.png',
];

export default function PhotoFrameEditor() {
  const [userImage, setUserImage] = useState(null);
  const [userImgObj, setUserImgObj] = useState(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [frameImage] = useImage(frameList[frameIndex]);

  const stageRef = useRef();
  const userImageRef = useRef();
  const trRef = useRef();
  const layerRef = useRef();

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

  const handleFrameChange = (index) => {
    setFrameIndex(index);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <label htmlFor="file-upload" className="bg-blue-600 text-white p-3 rounded-md cursor-pointer hover:bg-blue-700 transition duration-200">
        {userImage ? "Change Image" : "Upload Image"}
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
      </label>

      <Stage
        width={512}
        height={512}
        ref={stageRef}
        className="border border-gray-300"
        style={{ borderRadius: '50%', overflow: 'hidden' }}
      >
        <Layer ref={layerRef}>
          <Group
            clipFunc={(ctx) => {
              ctx.beginPath();
              ctx.arc(256, 256, 256, 0, Math.PI * 2, false);
              ctx.closePath();
            }}
          >
            {userImage && (
              <>
                <KonvaImage
                  image={userImgObj}
                  x={56}
                  y={56}
                  width={400}
                  height={400}
                  draggable
                  ref={userImageRef}
                />
                <Transformer
                  ref={trRef}
                  rotateEnabled={true}
                  enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 50 || newBox.height < 50) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                />
              </>
            )}
          </Group>

          {frameImage && (
            <KonvaImage image={frameImage} x={0} y={0} width={512} height={512} listening={false} />
          )}
        </Layer>
      </Stage>

      <button
        onClick={handleDownload}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
      >
        Save
      </button>
    </div>
  );
}
