import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";

const frameOptions = [
  "./assets/frames/frame1.png",
  "./assets/frames/frame2.png",
];

const stickerOptions = [
  "/assets/stickers/sticker1.png",
  "/assets/stickers/sticker2.png",
  "/assets/stickers/sticker3.png",
];

const videoConstraints = { width: 953, height: 599, facingMode: "user" };
const SLOT_WIDTH = 953;
const SLOT_HEIGHT = 599;

export default function Photobooth() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const frameImgRef = useRef(null);

  const slots = [
    { x: 123, y: 78 },
    { x: 123, y: 697 },
    { x: 123, y: 1286 },
    { x: 123, y: 1885 },
  ];

  const [selectedFrame, setSelectedFrame] = useState(null);
  const [mode, setMode] = useState("photo");

  const [photos, setPhotos] = useState([]);
  const [photoCount, setPhotoCount] = useState(0);
  const [canTakePhoto, setCanTakePhoto] = useState(true); // FIXED: boolean init
  const [draggingPhoto, setDraggingPhoto] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [countdown, setCountdown] = useState(null);

  const [stickers, setStickers] = useState([]);
  const [draggingSticker, setDraggingSticker] = useState(null);
  const [selectedSticker, setSelectedSticker] = useState(null);

  // Load Frame Image
  useEffect(() => {
    if (!selectedFrame) return;
    const img = new Image();
    img.src = selectedFrame;

    img.onload = () => {
      frameImgRef.current = img;
      drawCanvas();
    };
    img.onerror = () => {
      console.error("Gagal memuat gambar", selectedFrame);
    };
  }, [selectedFrame]);

  // Draw Canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !frameImgRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const frameWidth = frameImgRef.current.naturalWidth || frameImgRef.current.width;
    const frameHeight = frameImgRef.current.naturalHeight || frameImgRef.current.height;

    canvas.width = frameWidth;
    canvas.height = frameHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Gambar Photo
    photos.forEach((p) => {
      const slot = slots[p.slotIndex];
      if (!slot) return;
      const drawW = p.img.width * p.scale;
      const drawH = p.img.height * p.scale;
      const dx = slot.x + p.offsetX;
      const dy = slot.y + p.offsetY; // FIXED: offsety -> offsetY

      ctx.save();
      ctx.beginPath();
      ctx.rect(slot.x, slot.y, SLOT_WIDTH, SLOT_HEIGHT);
      ctx.clip();
      ctx.drawImage(p.img, dx, dy, drawW, drawH);
      ctx.restore();
    });

    // 2. Gambar Frame
    if (frameImgRef.current) {
      ctx.drawImage(frameImgRef.current, 0, 0, frameWidth, frameHeight);
    }

    // 3. Gambar Sticker
    stickers.forEach((s, i) => {
    const size = s.size || STICKER_SIZE;
    ctx.drawImage(s.img, s.x, s.y, size, size);

    if (i === selectedSticker) {
        ctx.strokeStyle = "#ff7aa2";
        ctx.lineWidth = 6; // Ditebalkan sedikit agar terlihat di canvas besar
        ctx.strokeRect(s.x, s.y, size, size);
    }
    });
  };

  useEffect(drawCanvas, [photos, stickers, selectedSticker, photoCount]);

  const handleBack = () => {
    if (mode === "decorate") {
      setMode("photo");
      setCanTakePhoto(false);
      setStickers([]);
      setSelectedSticker(null);
    } else {
      setSelectedFrame(null);
      setPhotos([]);
      setPhotoCount(0);
      setStickers([]);
      setSelectedSticker(null);
      setMode("photo");
      setCanTakePhoto(true);
    }
  };

  // Photos
  const addPhoto = (img) => {
    if (photoCount >= 4) return;

    const scale = SLOT_WIDTH / img.width;
    const drawH = img.height * scale;
    const offsetY = drawH > SLOT_HEIGHT ? (SLOT_HEIGHT - drawH) / 2 : 0;

    setPhotos((p) => [
      ...p,
      { img, slotIndex: photoCount, scale, offsetX: 0, offsetY },
    ]);

    setCanTakePhoto(true);

    setPhotoCount((c) => {
      const next = c + 1;
      if (next === 4) setMode("decorate");
      return next;
    });
  };

  const takePhotoNow = () => {
    if (!webcamRef.current) return;
    const src = webcamRef.current.getScreenshot();
    if (!src) return;
    const img = new Image();
    img.src = src;
    img.onload = () => addPhoto(img);
  };

  const capturePhoto = () => {
    if (!canTakePhoto || countdown !== null) return;

    setCanTakePhoto(false);
    setCountdown(3);

    let current = 3;
    const interval = setInterval(() => {
      current -= 1;

      if (current === 0) {
        clearInterval(interval);
        setCountdown(null);
        takePhotoNow();
      } else {
        setCountdown(current);
      }
    }, 1000);
  };

  const uploadPhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => addPhoto(img);
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const redoLastPhoto = () => {
    if (!photos.length) return;
    setPhotos((p) => p.slice(0, -1));
    setPhotoCount((c) => Math.max(0, c - 1));
    setCanTakePhoto(true);
  };

  const getCoords = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvasRef.current.width / r.width),
      y: (e.clientY - r.top) * (canvasRef.current.height / r.height),
    };
  };

  // Drag Photos & Stickers
  const STICKER_SIZE = 150;

  const handleMouseDown = (e) => {
    const {x, y} = getCoords(e);

    if (mode === "photo") {
        for (let i = photos.length - 1; i >= 0; i--) {
            const p = photos[i];
            const slot = slots[p.slotIndex];
            const w = p.img.width * p.scale;
            const h = p.img.height * p.scale;

            if (
                x >= slot.x + p.offsetX &&
                x <= slot.x + p.offsetX + w &&
                y >= slot.y + p.offsetY &&
                y <= slot.y + p.offsetY + h
            ) {
                setDraggingPhoto(i);
                setDragOffset({
                    x: x - slot.x - p.offsetX,
                    y: y - slot.y - p.offsetY,
                });
                return;
            }
        }
    }

    if (mode === "decorate") {
    for (let i = stickers.length - 1; i >= 0; i--) {
      const s = stickers[i];
      const size = s.size || STICKER_SIZE;

      // Cek apakah koordinat klik berada di dalam area stiker
      if (x >= s.x && x <= s.x + size && y >= s.y && y <= s.y + size) {
        setDraggingSticker(i);
        setSelectedSticker(i);
        setDragOffset({ x: x - s.x, y: y - s.y });
        return;
      }
    }
    // Jika klik di area kosong Canvas, lepas seleksi stiker
    setSelectedSticker(null);
  }
  };

  const handleMouseMove = (e) => {
    const { x, y } = getCoords(e);

    if (draggingPhoto !== null && mode === "photo") {
      setPhotos((prev) => {
        const updated = [...prev];
        const p = { ...updated[draggingPhoto] };
        const slot = slots[p.slotIndex];
        const w = p.img.width * p.scale;
        const h = p.img.height * p.scale;

        p.offsetX = x - slot.x - dragOffset.x;
        p.offsetY = y - slot.y - dragOffset.y;
        p.offsetX = Math.min(Math.max(p.offsetX, SLOT_WIDTH - w), 0);
        p.offsetY = Math.min(Math.max(p.offsetY, SLOT_HEIGHT - h), 0);

        updated[draggingPhoto] = p;
        return updated;
      });
    }

    if (draggingSticker !== null && mode === "decorate") {
      setStickers((s) => {
        const u = [...s];
        u[draggingSticker] = {
          ...u[draggingSticker],
          x: x - dragOffset.x,
          y: y - dragOffset.y,
        };
        return u;
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingPhoto(null);
    setDraggingSticker(null);
  };

  // Add Sticker
  const addSticker = (src) => {
  const img = new Image();
  img.src = src;
  img.onload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const size = 150; // Ukuran stiker di skala canvas
    // Munculkan di tengah-tengah Canvas
    const spawnX = (canvas.width - size) / 2;
    const spawnY = (canvas.height - size) / 2;

    setStickers((s) => [
      ...s,
      { img, x: spawnX, y: spawnY, size },
    ]);
  };
};

  // Delete Sticker Event
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedSticker != null &&
        mode === "decorate"
      ) {
        setStickers((s) => s.filter((_, i) => i !== selectedSticker));
        setSelectedSticker(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedSticker, mode]);

  // Download
  const downloadPhoto = () => {
    if (!canvasRef.current) return;
    const a = document.createElement("a");
    a.href = canvasRef.current.toDataURL("image/png");
    a.download = "photo-strip.png";
    a.click();
  };

  return (
    <div style={centerCol}>
      {/* Top Bar */}
      <div style={topBar}>
        {selectedFrame && (
          <button
            style={{
              ...buttonStyle,
              position: "absolute",
              left: 0,
              top: 10,
              height: 40,
              padding: "0 16px",
              lineHeight: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={handleBack}
          >
            ← Back
          </button>
        )}

        <h1 style={titleBar}>
          {!selectedFrame
            ? "₊✩‧₊˚ Select a frame౨ৎ ˚₊✩‧₊"
            : mode === "photo"
            ? "⋆｡‧˚ʚ Smile :)ɞ˚‧｡⋆"
            : ". ݁₊ ⊹ . ݁Let’s decorate . ⊹ ₊ ݁."}
        </h1>
      </div>

      <div style={mainContent}>
        {!selectedFrame ? (
          <div style={{ display: "flex", gap: 24 }}>
            {frameOptions.map((src) => {
              const isSelected = selectedFrame === src;

              return (
                <img
                  key={src}
                  src={src}
                  alt="frame"
                  onClick={() => setSelectedFrame(src)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.08)";
                    e.currentTarget.style.boxShadow =
                      "0 12px 30px rgba(255,122,162,0.45)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = frameThumb.boxShadow;
                  }}
                  style={{
                    ...frameThumb,
                    transform: isSelected ? "scale(1.08)" : "scale(1)",
                    transition:
                      "transform 0.25s ease, box-shadow 0.25s ease",
                    boxShadow: isSelected
                      ? "0 12px 30px rgba(255,122,162,0.45)"
                      : frameThumb.boxShadow,
                  }}
                />
              );
            })}
          </div>
        ) : (
          <div style={row}>
            <div>
              {mode === "photo" && (
                <>
                  <div style={{ position: "relative", width: 400 }}>
                    {/* Webcam */}
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/png"
                      videoConstraints={videoConstraints}
                      mirrored={true}
                      style={{ width: "100%", borderRadius: 12 }}
                    />

                    {/* Countdown Overlay */}
                    {countdown != null && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 96,
                          fontWeight: "bold",
                          color: "white",
                          textShadow: "0 4px 20px rgba(0,0,0,0.6)",
                          background: "rgba(0,0,0,0.25)",
                          borderRadius: 12,
                          pointerEvents: "none",
                        }}
                      >
                        {countdown}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                    {canTakePhoto && (
                      <>
                        <button style={buttonStyle} onClick={capturePhoto}>
                          Take Photo
                        </button>
                        <label style={{ ...buttonStyle, cursor: "pointer" }}>
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            onChange={uploadPhoto}
                            style={{ display: "none" }}
                          />
                        </label>
                      </>
                    )}

                    {/* Redo Button */}
                    {photoCount > 0 && (
                      <button
                        style={{
                          ...buttonStyle,
                          fontSize: 22,
                          padding: "4px 10px",
                        }}
                        onClick={redoLastPhoto}
                      >
                        ⟳
                      </button>
                    )}
                  </div>
                </>
              )}

              {mode === "decorate" && (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {stickerOptions.map((src) => (
                    <img
                      key={src}
                      src={src}
                      alt="sticker"
                      onClick={() => addSticker(src)}
                      style={{ width: 50, cursor: "pointer" }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Display Frame Canvas */}
            <div>
              <canvas
                ref={canvasRef}
                style={{
                    width: 200,
                    height: 500,
                    borderRadius: 16,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                    cursor: mode === "decorate" ? "pointer" : "default",
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp} // Mencegah freeze saat mouse keluar canvas
                />

              {mode === "decorate" && (
                <div
                  style={{
                    marginTop: 16,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <button style={buttonStyle} onClick={downloadPhoto}>
                    Download
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Styles
const centerCol = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 20,
};

const topBar = {
  width: 700,
  height: 60,
  position: "relative",
  marginBottom: 20,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const buttonStyle = {
  padding: "10px 20px",
  fontSize: 20,
  cursor: "pointer",
  fontFamily: "cantika cute",
  color: "#8c5b4a",
  border: "2px solid #8c5b4a",
  borderRadius: 8,
  background: "white",
};

const row = { display: "flex", gap: 40, alignItems: "flex-start" };

const frameThumb = {
  width: 180,
  cursor: "pointer",
  borderRadius: 12,
  boxShadow: "0 8px 8px rgba(0,0,0,0.15)",
};

const titleBar = {
  margin: 0,
  lineHeight: "60px",
  textAlign: "center",
  width: "100%",
};

const mainContent = {
  height: 600,
  width: 700,
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
};