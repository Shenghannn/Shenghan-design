import { MoreHorizontal, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "../../lib/cn";
import { useExclusiveFilterPanel } from "./exclusive-filter-group";
import { Button } from "./button";
import { Textarea } from "./textarea";

export function parseBatchValues(value: string) {
  return Array.from(
    new Set(
      value
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function isAlphaNumericList(values: string[]) {
  return values.every((item) => /^[A-Za-z0-9]+$/.test(item));
}

type BatchExactSearchProps = {
  title: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
  className?: string;
  textareaPlaceholder?: string;
  hint?: string;
  maxRows?: number;
  validateValues?: (values: string[]) => string | null;
};

export function BatchExactSearch({
  title,
  placeholder,
  values,
  onChange,
  className,
  textareaPlaceholder = "精确搜索，一项一行，最多支持200行",
  hint,
  maxRows = 200,
  validateValues,
}: BatchExactSearchProps) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const { open, setOpen } = useExclusiveFilterPanel(panelId);
  const [draft, setDraft] = useState(values.join("\n"));
  const parsedValues = parseBatchValues(draft);
  const validationMessage =
    parsedValues.length > maxRows
      ? `最多支持 ${maxRows} 行`
      : validateValues?.(parsedValues) ?? null;
  const canConfirm = parsedValues.length > 0 && !validationMessage;

  useEffect(() => {
    setDraft(values.join("\n"));
  }, [values]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeAndResetDraft();
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [open, values]);

  function closeAndResetDraft() {
    setDraft(values.join("\n"));
    setOpen(false);
  }

  function confirm() {
    if (!canConfirm) {
      return;
    }
    onChange(parsedValues);
    setOpen(false);
  }

  function clear() {
    setDraft("");
    onChange([]);
    setOpen(false);
  }

  const resolvedHint = hint ?? `最多支持 ${maxRows} 行，精确匹配。`;

  return (
    <div ref={rootRef} className={cn("group relative", className)}>
      <button
        type="button"
        className="field-control relative flex w-full items-center justify-between gap-2 pr-10 text-left"
        onClick={() => {
          setDraft(values.join("\n"));
          setOpen(true);
        }}
      >
        <span className={cn("min-w-0 flex-1 truncate", values.length ? "text-text-primary" : "text-text-placeholder")}>
          {values.length ? `已选择 ${values.length} 项` : placeholder}
        </span>
        <Search
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2",
            values.length ? "text-primary" : "text-text-muted",
          )}
        />
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-[360px] rounded-sm border border-border bg-white p-2 shadow-md">
          <div className="mb-2 flex items-center justify-between gap-2 border-b border-border pb-2">
            <div className="font-medium text-text-primary">{title}</div>
            <button
              type="button"
              aria-label="关闭批量搜索"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-white text-text-muted hover:border-primary hover:text-primary"
              onClick={closeAndResetDraft}
            >
              ×
            </button>
          </div>
          <Textarea
            autoFocus
            className="min-h-[160px]"
            value={draft}
            placeholder={textareaPlaceholder}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                closeAndResetDraft();
              }
            }}
          />
          <div className="mt-1 text-mini text-text-muted">{resolvedHint}</div>
          {validationMessage ? <div className="mt-1 text-mini text-danger">{validationMessage}</div> : null}
          <div className="mt-3 flex items-center justify-between gap-2">
            <Button className="min-w-[64px]" variant="secondary" size="sm" onClick={clear}>
              清空
            </Button>
            <div className="flex gap-2">
              <Button className="min-w-[64px]" variant="secondary" size="sm" onClick={closeAndResetDraft}>
                关闭
              </Button>
              <Button className="min-w-[64px]" variant="primary" size="sm" disabled={!canConfirm} onClick={confirm}>
                搜索
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type ExactBatchSearchProps = {
  title: string;
  placeholder?: string;
  batchPlaceholder?: string;
  value: string;
  batchValues: string[];
  onValueChange: (value: string) => void;
  onBatchChange: (values: string[]) => void;
  className?: string;
  textareaPlaceholder?: string;
  hint?: string;
  maxRows?: number;
  validateValues?: (values: string[]) => string | null;
};

/** 单行精确搜索 + 批量精确搜索，参考 jiniu-erp-ui SelectSearch moreSearch 交互 */
export function ExactBatchSearch({
  title,
  placeholder = "请输入",
  batchPlaceholder = "批量搜索",
  value,
  batchValues,
  onValueChange,
  onBatchChange,
  className,
  textareaPlaceholder,
  hint,
  maxRows,
  validateValues,
}: ExactBatchSearchProps) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const { open, setOpen } = useExclusiveFilterPanel(`${panelId}-batch`);
  const [draft, setDraft] = useState(batchValues.join("\n"));
  const parsedValues = parseBatchValues(draft);
  const validationMessage =
    parsedValues.length > (maxRows ?? 200)
      ? `最多支持 ${maxRows ?? 200} 行`
      : validateValues?.(parsedValues) ?? null;
  const canConfirm = parsedValues.length > 0 && !validationMessage;
  const showBatchActive = batchValues.length > 0;

  useEffect(() => {
    setDraft(batchValues.join("\n"));
  }, [batchValues]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setDraft(batchValues.join("\n"));
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [batchValues, open]);

  function confirmBatch() {
    if (!canConfirm) {
      return;
    }
    onBatchChange(parsedValues);
    onValueChange("");
    setOpen(false);
  }

  function clearBatch() {
    setDraft("");
    onBatchChange([]);
    setOpen(false);
  }

  const resolvedHint = hint ?? `最多支持 ${maxRows ?? 200} 行，精确匹配。`;

  return (
    <div ref={rootRef} className={cn("group relative", className)}>
      <div className="field-control flex items-center gap-2 pr-1">
        <input
          className="min-w-0 flex-1 border-0 bg-transparent px-0 text-body outline-none placeholder:text-text-placeholder"
          value={value}
          placeholder={showBatchActive ? `已选择 ${batchValues.length} 项` : placeholder}
          readOnly={showBatchActive}
          onChange={(event) => {
            onValueChange(event.target.value);
            if (batchValues.length > 0) {
              onBatchChange([]);
            }
          }}
        />
        <button
          type="button"
          aria-label={batchPlaceholder}
          className={cn(
            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-text-muted transition hover:bg-bg-hover",
            (open || showBatchActive) && "text-primary",
          )}
          onClick={() => {
            setDraft(batchValues.join("\n"));
            setOpen(true);
          }}
        >
          <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-[360px] rounded-sm border border-border bg-white p-2 shadow-md">
          <div className="mb-2 flex items-center justify-between gap-2 border-b border-border pb-2">
            <div className="font-medium text-text-primary">{title}</div>
            <button
              type="button"
              aria-label="关闭批量搜索"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-white text-text-muted hover:border-primary hover:text-primary"
              onClick={() => {
                setDraft(batchValues.join("\n"));
                setOpen(false);
              }}
            >
              ×
            </button>
          </div>
          <Textarea
            autoFocus
            className="min-h-[160px]"
            value={draft}
            placeholder={textareaPlaceholder ?? "精确搜索，一项一行，最多支持200行"}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setDraft(batchValues.join("\n"));
                setOpen(false);
              }
            }}
          />
          <div className="mt-1 text-mini text-text-muted">{resolvedHint}</div>
          {validationMessage ? <div className="mt-1 text-mini text-danger">{validationMessage}</div> : null}
          <div className="mt-3 flex items-center justify-between gap-2">
            <Button className="min-w-[64px]" variant="secondary" size="sm" onClick={clearBatch}>
              清空
            </Button>
            <div className="flex gap-2">
              <Button
                className="min-w-[64px]"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setDraft(batchValues.join("\n"));
                  setOpen(false);
                }}
              >
                关闭
              </Button>
              <Button className="min-w-[64px]" variant="primary" size="sm" disabled={!canConfirm} onClick={confirmBatch}>
                确认
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
