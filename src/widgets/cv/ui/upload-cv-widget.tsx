import {
  useId,
  useMemo,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import { CloudUpload, Loader2 } from "lucide-react";
import { useUploadCv } from "@/features/cv/model/cv.model";

type UploadCvResult = Awaited<
  ReturnType<ReturnType<typeof useUploadCv>["uploadCv"]>
>;

export type UploadCvWidgetProps = {
  value: string;
  onValueChange: (value: string) => void;
  onUploadSuccess?: (result: UploadCvResult, file: File) => void;
  onUploadError?: (error: unknown, file: File) => void;
  disabled?: boolean;
  title?: string;
  placeholder?: string;
  accept?: string;
  uploadIdleLabel?: string;
  uploadLoadingLabel?: string;
  helperText?: ReactNode;
  headerAction?: ReactNode;
  className?: string;
  minHeightClassName?: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function fileMatchesAccept(file: File, accept: string) {
  const rules = accept
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (rules.length === 0) return true;

  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  return rules.some((rule) => {
    if (rule.startsWith(".")) return fileName.endsWith(rule);
    if (rule.endsWith("/*")) {
      const prefix = rule.slice(0, -1);
      return fileType.startsWith(prefix);
    }
    return fileType === rule;
  });
}

export function UploadCvWidget({
  value,
  onValueChange,
  onUploadSuccess,
  onUploadError,
  disabled = false,
  title = "Step 1: Upload a resume",
  placeholder = "Paste resume text",
  accept = ".pdf,.doc,.docx,.txt",
  uploadIdleLabel = "Drag & Drop or Upload Your Resume",
  uploadLoadingLabel = "Processing...",
  helperText,
  headerAction,
  className,
  minHeightClassName = "min-h-[180px]",
}: UploadCvWidgetProps) {
  const { uploadCv, isUploading } = useUploadCv();
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const inputId = useId();
  const isDisabled = disabled || isUploading;

  const acceptedDisplayText = useMemo(() => {
    return accept
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .join(", ");
  }, [accept]);

  const handleUpload = async (file: File) => {
    if (!fileMatchesAccept(file, accept)) {
      setErrorMessage(
        `Unsupported file type. Accepted: ${acceptedDisplayText}`,
      );
      return;
    }

    try {
      setErrorMessage(null);
      const result = await uploadCv(file);
      setUploadedFileName(result.fileName);
      onUploadSuccess?.(result, file);
    } catch (error) {
      setErrorMessage("Upload failed, please try again.");
      onUploadError?.(error, file);
    }
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (isDisabled) return;

    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void handleUpload(file);
    }
  };

  return (
    <div
      className={cn(
        "border border-border rounded-xl overflow-hidden flex flex-col",
        className,
      )}
    >
      <div className="flex items-center justify-between p-4 bg-background border-b border-border">
        <label className="text-sm font-semibold text-foreground">{title}</label>
        {headerAction}
      </div>

      <div className="p-4 flex-1 flex flex-col gap-4 bg-background/50">
        <textarea
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={placeholder}
          disabled={isDisabled}
          className={cn(
            "w-full flex-1 bg-transparent text-sm text-muted-foreground resize-none outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-70",
            minHeightClassName,
          )}
        />

        <label
          htmlFor={inputId}
          onDragOver={(event) => {
            event.preventDefault();
            if (!isDisabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex items-center justify-center gap-2 w-full py-2.5 border border-dashed rounded-lg text-sm font-medium bg-white transition-colors shadow-sm",
            isDisabled
              ? "cursor-not-allowed text-muted-foreground/60 border-border"
              : "cursor-pointer text-muted-foreground border-border hover:border-foreground hover:text-foreground",
            isDragging &&
              !isDisabled &&
              "border-foreground text-foreground bg-muted",
          )}
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-foreground" />
          ) : (
            <CloudUpload className="w-4 h-4" />
          )}
          {isUploading ? uploadLoadingLabel : uploadIdleLabel}
          <input
            id={inputId}
            type="file"
            className="hidden"
            accept={accept}
            disabled={isDisabled}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handleUpload(file);
              }
              event.target.value = "";
            }}
          />
        </label>

        {helperText ? (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        ) : null}

        {uploadedFileName ? (
          <p className="text-xs text-foreground">
            Uploaded: {uploadedFileName}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="text-xs text-destructive">{errorMessage}</p>
        ) : null}
      </div>
    </div>
  );
}
