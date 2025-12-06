import React from "react";
import { cn } from "@/lib/utils";

interface FileDropZoneProps {
  onFilesDropped: (files: File[]) => void;
  children: React.ReactNode;
  className?: string;
  dropMessage?: string;
  accept?: string;
}

export function FileDropZone({
  onFilesDropped,
  children,
  className,
  dropMessage = "拖放文件到这里",
  accept,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const dragCounterRef = React.useRef(0);

  // 检测是否是文件拖拽（而非 DOM 元素拖拽）
  const isFileDrag = (e: React.DragEvent): boolean => {
    if (!e.dataTransfer.types) return false;
    // 文件拖拽会包含 "Files" type
    return e.dataTransfer.types.includes("Files");
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);

    if (files.length > 0) {
      // 如果指定了 accept，过滤文件类型
      const filteredFiles = accept
        ? files.filter((file) => {
            const acceptTypes = accept.split(",").map((type) => type.trim());
            return acceptTypes.some((type) => {
              if (type.startsWith(".")) {
                return file.name.endsWith(type);
              }
              if (type.endsWith("/*")) {
                return file.type.startsWith(type.slice(0, -1));
              }
              return file.type === type;
            });
          })
        : files;

      if (filteredFiles.length > 0) {
        onFilesDropped(filteredFiles);
      }
    }
  };

  // 处理拖拽被取消的情况（如按 ESC 键）
  React.useEffect(() => {
    const handleDragEnd = () => {
      dragCounterRef.current = 0;
      setIsDragging(false);
    };

    window.addEventListener("dragend", handleDragEnd);
    window.addEventListener("drop", handleDragEnd);

    return () => {
      window.removeEventListener("dragend", handleDragEnd);
      window.removeEventListener("drop", handleDragEnd);
    };
  }, []);

  return (
    <div
      className={cn("relative", className)}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
      {isDragging && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary pointer-events-none flex items-center justify-center z-50">
          <div className="text-2xl font-semibold text-primary">{dropMessage}</div>
        </div>
      )}
    </div>
  );
}
