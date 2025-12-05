"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

import type { Session } from "next-auth";
import { signOut } from "next-auth/react";

import ButtonBase from "@mui/material/ButtonBase";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";

import { styled } from "@mui/material/styles";
import clsx from "clsx";

import { NumericFormat } from "react-number-format";

import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";

import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import AutoDeleteRoundedIcon from "@mui/icons-material/AutoDeleteRounded";

import { ImageContainerProvider } from "@/contexts/ImageContainerContext";
import { useImageModal } from "@/contexts/ImageContainerContext";

import {
  type FileUploaderResult,
  useFileUploader,
} from "@/hooks/use-file-uploader";
import { FileDropzone } from "@/components/FileDropzone";

import { useLocalStorage } from "@/hooks/use-local-storage";

interface UploadedImage {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  date: string;
}

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

export function UploadPageCore({
  limit,
  fileUploaderProps,
}: {
  limit: number;
  fileUploaderProps: FileUploaderResult;
}) {
  const { file, imageContent, imageMetadata, handleFileUploadEvent, cancel } =
    fileUploaderProps;

  const { openModal: open } = useImageModal();

  const [isMounted, setIsMounted] = useState(false);

  const [ttlEnabled, setTtlEnabled] = useLocalStorage("ttl_enabled", false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [displayedTtlValue, setDisplayedTtlValue] = useState<string | null>(
    null,
  );
  const [ttlValue, setTtlValue] = useLocalStorage("ttl_value", 3600);

  const [images, setImages] = useState<UploadedImage[]>([]);
  const imagesRefs = useRef<(HTMLButtonElement | null)[]>(
    Array(images.length).fill(null),
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isFirstLoad) return;
    const parsed = String(ttlValue);
    setDisplayedTtlValue(parsed);
    setIsFirstLoad(false);
  }, [isFirstLoad, ttlValue]);

  useEffect(() => {
    if (!displayedTtlValue) return;
    const formatted = displayedTtlValue.replace(/,/g, "");
    const parsed = parseInt(formatted);

    if (isNaN(parsed)) return;

    console.log("Set number", parsed);
    setTtlValue(parsed);
  }, [displayedTtlValue]);

  // fetch list on load
  useEffect(() => {
    fetch("/api/images")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setImages(data.files);
      });
  }, []);

  useEffect(() => {
    imagesRefs.current = imagesRefs.current.slice(0, images.length);
  }, [images.length]);

  useEffect(() => {
    if (imagesRefs.current.length < 1) return;

    const handleFocusWithin = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      const relatedTarget = event.relatedTarget as HTMLElement;

      imagesRefs.current.forEach((ref, index) => {
        if (!ref) return;

        const container = ref.closest(".image-container");
        if (!container) return;

        const isTargetWithin = container.contains(target);
        const isRelatedWithin =
          relatedTarget && container.contains(relatedTarget);

        if (event.type === "focusin" && isTargetWithin) {
          setFocusedIndex(index);
        } else if (
          event.type === "focusout" &&
          isTargetWithin &&
          !isRelatedWithin
        ) {
          setFocusedIndex(null);
        }
      });
    };

    document.addEventListener("focusin", handleFocusWithin);
    document.addEventListener("focusout", handleFocusWithin);

    return () => {
      document.removeEventListener("focusin", handleFocusWithin);
      document.removeEventListener("focusout", handleFocusWithin);
    };
  }, [images.length]);

  useEffect(() => {
    if (!file) return;

    const uploadFileToCloud = async () => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("ttl", String(ttlValue));

      setLoading(true);
      const res = await fetch("/api/images", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      setLoading(false);

      if (res.ok && result.success) {
        setImages((prev) => [...prev, result]);
      } else {
        alert(result.error?.message || "Upload failed");
      }
    };

    uploadFileToCloud();
  }, [file]);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/images/${id}`, { method: "DELETE" });
    const result = await res.json();
    if (res.ok && result.success) {
      setImages((prev) => prev.filter((img) => img.id !== id));
    } else {
      alert(result.error?.message || "Delete failed");
    }
  }

  function handleDownload(image: UploadedImage) {
    const link = document.createElement("a");
    link.href = image.url;
    link.download = image.filename;
    link.click();
  }

  function handleInfo(image: UploadedImage) {
    const getFileTypeDescription = (filename: string, mimeType: string) => {
      const extension = filename.split(".").pop()?.toUpperCase();
      if (!extension) return "Unknown file type";

      const typeMap: { [key: string]: string } = {
        PNG: "PNG file",
        JPG: "JPG file",
        JPEG: "JPEG file",
        WEBP: "WebP file",
        GIF: "GIF file",
        SVG: "SVG file",
        BMP: "BMP file",
        TIFF: "TIFF file",
        ICO: "ICO file",
      };

      return typeMap[extension] || `${extension} file`;
    };

    const fileType = getFileTypeDescription(image.filename, image.mimeType);

    const rawDate = new Date(image.date);
    const locate = navigator.language;
    const date = Intl.DateTimeFormat(locate, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    }).format(rawDate);

    alert(`File Name: ${image.filename}\nType: ${fileType}\nDate: ${date}`);
  }

  function openModal(image: UploadedImage) {
    open({
      img: image,
      src: image.url,
      link: image.url,
      unoptimized: true,
      handleDownload,
      handleInfo,
      handleDelete,
    });
  }

  const isImageActive = (index: number) => {
    return hoveredIndex === index || focusedIndex === index;
  };

  return (
    <div className="flex flex-col items-center p-0">
      <div className="flex flex-col items-center gap-2">
        {isMounted && (
          <div className="mb-4 flex flex-col items-center gap-2">
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    id="ttl-enabled"
                    name="ttl-enabled"
                    checked={ttlEnabled}
                    onChange={(_, checked) => setTtlEnabled(checked)}
                    slotProps={{ input: { "aria-label": "controlled" } }}
                  />
                }
                label="Enable Expiration (TTL)"
              />
            </FormGroup>
            {ttlEnabled && (
              <>
                <NumericFormat
                  value={displayedTtlValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    const formatted = value.replace(/^0+(?=\d)/, "");
                    setDisplayedTtlValue(formatted);
                  }}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (!value) {
                      setDisplayedTtlValue("0");
                      return;
                    }
                  }}
                  customInput={TextField}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <AutoDeleteRoundedIcon className="text-xl" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  thousandSeparator
                  valueIsNumericString
                  prefix=""
                  variant="standard"
                  label="Time in seconds"
                />
              </>
            )}
          </div>
        )}
        <div>
          <Button
            component="label"
            variant="contained"
            startIcon={<CloudUploadRoundedIcon />}
            tabIndex={-1}
            disabled={loading}
            loading={loading}
          >
            Upload file
            <VisuallyHiddenInput
              type="file"
              onChange={handleFileUploadEvent}
              accept="image/*"
            />
          </Button>
        </div>
      </div>
      <div className="flex w-full flex-col items-center py-6 text-center">
        <div className="flex flex-row items-center gap-2">
          <h2 className="text-xl font-semibold">Gallery</h2>
          <p className="mt-0.5 text-sm text-[#6b6b6b] dark:text-[#a5a5a5]">
            {images.length} / {limit}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1">
          {images.map((img, index) => (
            <div
              key={img.id}
              className="image-container relative aspect-square h-40 overflow-hidden rounded-2xl"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <ButtonBase
                ref={(instance) => {
                  imagesRefs.current[index] = instance;
                }}
                className="relative h-full w-full cursor-pointer overflow-hidden rounded-2xl focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                onClick={() => openModal(img)}
                tabIndex={0}
              >
                <Image
                  src={img.url}
                  alt={img.filename}
                  width={160}
                  height={160}
                  draggable={false}
                  unoptimized
                  className={clsx(
                    "h-40 w-full rounded object-cover transition-all duration-300",
                    isImageActive(index) ? "scale-120" : "scale-100",
                  )}
                />
                {/* Vignette effect on hover/focus */}
                <div
                  className={clsx(
                    `pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/40 transition-all duration-300`,
                    isImageActive(index) ? "opacity-100" : "opacity-0",
                  )}
                  style={{
                    background:
                      "radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.4) 80%)",
                  }}
                />
              </ButtonBase>

              <div
                className={clsx(
                  `absolute right-2 bottom-2 flex gap-1`,
                  isImageActive(index) ? "" : "pointer-events-none",
                )}
              >
                <IconButton
                  key={`download-${img.id}-${isImageActive(index)}`}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(img);
                  }}
                  className={clsx(
                    "bg-black/50 text-white duration-200 hover:bg-black/70",
                    isImageActive(index)
                      ? "opacity-100"
                      : "pointer-events-none opacity-0",
                  )}
                  tabIndex={isImageActive(index) ? 0 : -1}
                  style={{
                    visibility: isImageActive(index) ? "visible" : "hidden",
                  }}
                  sx={{
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.7)",
                    },
                  }}
                  data-aos={isImageActive(index) ? "fade-up" : undefined}
                  data-aos-delay="0"
                >
                  <FileDownloadRoundedIcon fontSize="small" />
                </IconButton>

                <IconButton
                  key={`info-${img.id}-${isImageActive(index)}`}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInfo(img);
                  }}
                  className={clsx(
                    "bg-black/50 text-white duration-200 hover:bg-black/70",
                    isImageActive(index)
                      ? "opacity-100"
                      : "pointer-events-none opacity-0",
                  )}
                  style={{
                    visibility: isImageActive(index) ? "visible" : "hidden",
                  }}
                  tabIndex={isImageActive(index) ? 0 : -1}
                  sx={{
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.7)",
                    },
                  }}
                  data-aos={isImageActive(index) ? "fade-up" : undefined}
                  data-aos-delay="50"
                >
                  <InfoRoundedIcon fontSize="small" />
                </IconButton>

                <IconButton
                  key={`delete-${img.id}-${isImageActive(index)}`}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(img.id);
                  }}
                  className={clsx(
                    "bg-black/50 text-white transition duration-200 hover:bg-red-600/70",
                    isImageActive(index)
                      ? "opacity-100"
                      : "pointer-events-none opacity-0",
                  )}
                  style={{
                    visibility: isImageActive(index) ? "visible" : "hidden",
                  }}
                  tabIndex={isImageActive(index) ? 0 : -1}
                  sx={{
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "rgba(239, 68, 68, 0.7)",
                    },
                  }}
                  data-aos={isImageActive(index) ? "fade-up" : undefined}
                  data-aos-delay="100"
                >
                  <DeleteForeverRoundedIcon fontSize="small" />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function UploadPage({
  session,
  limit,
}: {
  session: Session;
  limit: number;
}) {
  const fileUploaderProps = useFileUploader();

  return (
    <ImageContainerProvider>
      <FileDropzone
        setCurrentFile={fileUploaderProps.handleFileUpload}
        acceptedFileTypes={[
          "image/*",
          ".jpg",
          ".jpeg",
          ".png",
          ".webp",
          ".svg",
        ]}
        dropText="Drop image file"
      >
        <div className="flex min-h-screen flex-col items-center justify-center gap-16 p-8 font-sans sm:p-20">
          <header className="flex w-full flex-col gap-2 text-center">
            <h1 className="text-3xl font-bold">Upload Pics</h1>
            <hr className="border-[#d4d4d4] dark:border-[#383838]" />
          </header>
          <main className="flex flex-col items-center gap-4">
            <div className="flex flex-col gap-2 text-center">
              <h2 className="text-2xl font-semibold">Dashboard</h2>
              <p className="text-[#575757] dark:text-[#b9b9b9]">
                Easily upload and store your images — either permanently or
                temporarily. Perfect for quick temporary sharing or building a
                lasting image library.
              </p>
            </div>

            <div className="mb-10">
              <UploadPageCore
                fileUploaderProps={fileUploaderProps}
                limit={limit}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                LinkComponent={Link}
                href="/"
                variant="outlined"
                startIcon={<HomeRoundedIcon />}
              >
                Home
              </Button>
              {session.user && (
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => signOut()}
                  startIcon={<LogoutRoundedIcon />}
                >
                  Sign Out
                </Button>
              )}
            </div>
          </main>
        </div>
      </FileDropzone>
    </ImageContainerProvider>
  );
}
