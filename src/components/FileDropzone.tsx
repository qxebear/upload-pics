"use client";
import React, { useCallback, useState, useRef } from "react";

interface FileDropzoneProps {
  children: React.ReactNode;
  acceptedFileTypes: string[];
  dropText: string;
  setCurrentFile: (file: File) => void;
}

export function FileDropzone({
  children,
  acceptedFileTypes,
  dropText,
  setCurrentFile,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const matchesAcceptedTypes = useCallback(
    (items: DataTransferItemList) => {
      return Array.from(items).some((item) => {
        if (item.kind !== "file") return false; // ignore hyperlinks and text
        const type = item.type;

        return (
          acceptedFileTypes.includes(type) ||
          acceptedFileTypes.some((accepted) => {
            if (accepted.endsWith("/*")) {
              const baseType = accepted.split("/")[0];
              return type.startsWith(baseType + "/");
            }
            return type === accepted;
          })
        );
      });
    },
    [acceptedFileTypes],
  );

  const handleDragIn = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current++;

      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        if (matchesAcceptedTypes(e.dataTransfer.items)) {
          setIsDragging(true);
        }
      }
    },
    [matchesAcceptedTypes],
  );

  const handleDragOut = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;

    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const droppedFile = files[0];

        if (!droppedFile) {
          alert("How did you do a drop with no files???");
          return;
        }

        if (
          !acceptedFileTypes.includes(droppedFile.type) &&
          !acceptedFileTypes.some((type) =>
            type.endsWith("/*")
              ? droppedFile.type.startsWith(type.split("/")[0] + "/")
              : droppedFile.name.toLowerCase().endsWith(type.replace("*", "")),
          )
        ) {
          alert("Invalid file type. Please upload a supported file type.");
          return;
        }

        setCurrentFile(droppedFile);
      }
    },
    [acceptedFileTypes, setCurrentFile],
  );

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className="h-full w-full"
    >
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="animate-in fade-in zoom-in relative flex h-[90%] w-[90%] transform items-center justify-center rounded-xl border-2 border-dashed border-[#bebebe] transition-all duration-200 ease-out dark:border-white/30">
            <p className="text-2xl font-semibold text-white">{dropText}</p>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
