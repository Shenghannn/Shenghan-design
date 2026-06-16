import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/cn";
import { useExclusiveFilterPanel } from "./exclusive-filter-group";

export type DateRangeValue = {
  start: string;
  end: string;
};

export type DateRangePreset = {
  label: string;
  start: string;
  end: string;
};

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(value: string) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function addYears(date: Date, amount: number) {
  return new Date(date.getFullYear() + amount, date.getMonth(), 1);
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isBetween(date: Date, start: Date, end: Date) {
  const time = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  const min = Math.min(startTime, endTime);
  const max = Math.max(startTime, endTime);
  return time >= min && time <= max;
}

function getDefaultThreeMonthRange() {
  const end = new Date();
  const start = new Date(end);
  const targetDay = end.getDate();
  start.setMonth(start.getMonth() - 3);
  if (start.getDate() !== targetDay) {
    start.setDate(0);
  }

  return {
    start: formatDate(start),
    end: formatDate(end),
  };
}

function buildDefaultPresets(): DateRangePreset[] {
  const today = new Date();
  const todayText = formatDate(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayText = formatDate(yesterday);

  const monthStart = formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
  const lastMonthStart = formatDate(new Date(today.getFullYear(), today.getMonth() - 1, 1));
  const lastMonthEnd = formatDate(new Date(today.getFullYear(), today.getMonth(), 0));
  const yearStart = formatDate(new Date(today.getFullYear(), 0, 1));
  const lastYearStart = formatDate(new Date(today.getFullYear() - 1, 0, 1));
  const lastYearEnd = formatDate(new Date(today.getFullYear() - 1, 11, 31));

  const subtractDays = (days: number) => {
    const next = new Date(today);
    next.setDate(next.getDate() - days);
    return formatDate(next);
  };

  return [
    { label: "今天", start: todayText, end: todayText },
    { label: "昨天", start: yesterdayText, end: yesterdayText },
    { label: "最近7天", start: subtractDays(6), end: todayText },
    { label: "最近30天", start: subtractDays(29), end: todayText },
    { label: "最近三个月", ...getDefaultThreeMonthRange() },
    { label: "本月", start: monthStart, end: todayText },
    { label: "上月", start: lastMonthStart, end: lastMonthEnd },
    { label: "本年", start: yearStart, end: todayText },
    { label: "去年", start: lastYearStart, end: lastYearEnd },
  ];
}

function getMonthGrid(month: Date) {
  const firstDay = startOfMonth(month);
  const startOffset = firstDay.getDay();
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return {
      date,
      inCurrentMonth: date.getMonth() === month.getMonth(),
    };
  });
}

function MonthPanel({
  month,
  draftStart,
  draftEnd,
  pendingStart,
  onDayClick,
  onPrevMonth,
  onNextMonth,
  onPrevYear,
  onNextYear,
}: {
  month: Date;
  draftStart: Date | null;
  draftEnd: Date | null;
  pendingStart: Date | null;
  onDayClick: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onPrevYear: () => void;
  onNextYear: () => void;
}) {
  const days = useMemo(() => getMonthGrid(month), [month]);
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div className="w-[252px]">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="上一年"
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-text-muted transition hover:bg-bg-hover hover:text-text-primary"
            onClick={onPrevYear}
          >
            <span className="text-[11px] leading-none">«</span>
          </button>
          <button
            type="button"
            aria-label="上一月"
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-text-muted transition hover:bg-bg-hover hover:text-text-primary"
            onClick={onPrevMonth}
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <div className="text-body font-medium text-text-primary">
          {month.getFullYear()}年 {month.getMonth() + 1}月
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="下一月"
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-text-muted transition hover:bg-bg-hover hover:text-text-primary"
            onClick={onNextMonth}
          >
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="下一年"
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-text-muted transition hover:bg-bg-hover hover:text-text-primary"
            onClick={onNextYear}
          >
            <span className="text-[11px] leading-none">»</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center text-small">
        {weekDays.map((weekDay) => (
          <div key={weekDay} className="py-1 text-text-muted">
            {weekDay}
          </div>
        ))}
        {days.map(({ date, inCurrentMonth }) => {
          const rangeStart = draftStart;
          const rangeEnd = draftEnd ?? pendingStart;
          const hasRange = Boolean(rangeStart && rangeEnd);
          const isStart = rangeStart ? isSameDay(date, rangeStart) : false;
          const isEnd = draftEnd ? isSameDay(date, draftEnd) : false;
          const inRange =
            hasRange && rangeStart && rangeEnd
              ? isBetween(date, rangeStart, rangeEnd)
              : pendingStart
                ? isSameDay(date, pendingStart)
                : false;
          const isEndpoint = isStart || isEnd;

          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={!inCurrentMonth}
              onClick={() => onDayClick(date)}
              className={cn(
                "relative mx-auto flex h-8 w-8 items-center justify-center rounded-full transition",
                !inCurrentMonth && "cursor-default text-text-placeholder",
                inCurrentMonth && !isEndpoint && !inRange && "text-text-primary hover:bg-bg-hover",
                inRange && !isEndpoint && "rounded-none bg-primary-subtle/70 text-text-primary",
                isStart && inRange && !isEnd && "rounded-r-none bg-primary-subtle/70",
                isEnd && inRange && !isStart && "rounded-l-none bg-primary-subtle/70",
                isEndpoint && "bg-primary text-white hover:bg-primary",
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateRangePicker({
  value,
  onChange,
  presets,
  className,
  filterPanelId,
}: {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  presets?: DateRangePreset[];
  className?: string;
  filterPanelId?: string;
}) {
  const autoPanelId = useId();
  const panelId = filterPanelId ?? autoPanelId;
  const { open, setOpen, toggle } = useExclusiveFilterPanel(panelId);
  const [draft, setDraft] = useState<DateRangeValue>(value);
  const [pendingStart, setPendingStart] = useState<Date | null>(null);
  const [leftMonth, setLeftMonth] = useState(() => startOfMonth(parseDate(value.start) ?? new Date()));
  const [rightMonth, setRightMonth] = useState(() => {
    const end = parseDate(value.end);
    const start = parseDate(value.start);
    if (end && start && end.getTime() > start.getTime()) {
      return startOfMonth(end);
    }
    return addMonths(startOfMonth(start ?? new Date()), 1);
  });
  const containerRef = useRef<HTMLDivElement | null>(null);

  const builtinPresets = useMemo<DateRangePreset[]>(() => presets ?? buildDefaultPresets(), [presets]);

  const draftStart = parseDate(draft.start);
  const draftEnd = parseDate(draft.end);

  useEffect(() => {
    setDraft(value);
  }, [value.end, value.start]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        closePanel();
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function syncPanels(start: Date | null, end: Date | null) {
    if (!start) {
      return;
    }

    setLeftMonth(startOfMonth(start));
    if (end && end.getTime() > start.getTime()) {
      setRightMonth(startOfMonth(end));
      return;
    }

    setRightMonth(addMonths(startOfMonth(start), 1));
  }

  function applyRange(start: string, end: string) {
    const next = { start, end };
    setDraft(next);
    onChange(next);
    syncPanels(parseDate(start), parseDate(end));
    setPendingStart(null);
  }

  function handlePresetClick(preset: DateRangePreset) {
    applyRange(preset.start, preset.end);
  }

  function handleDayClick(date: Date) {
    if (!pendingStart || (draftStart && draftEnd)) {
      setPendingStart(date);
      setDraft({ start: formatDate(date), end: "" });
      return;
    }

    const start = pendingStart.getTime() <= date.getTime() ? pendingStart : date;
    const end = pendingStart.getTime() <= date.getTime() ? date : pendingStart;
    applyRange(formatDate(start), formatDate(end));
  }

  function openPanel() {
    setOpen(true);
    setPendingStart(null);
    syncPanels(parseDate(draft.start), parseDate(draft.end));
  }

  function closePanel() {
    setOpen(false);
    setPendingStart(null);
  }

  const displayText =
    value.start && value.end ? `${value.start} - ${value.end}` : "请选择日期范围";

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => (open ? closePanel() : openPanel())}
        className="field-control inline-flex h-input-md w-[248px] items-center justify-between gap-2 px-3 text-left"
      >
        <span className={cn("truncate", value.start && value.end ? "text-text-primary" : "text-text-placeholder")}>
          {displayText}
        </span>
        <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0 text-text-muted" />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 flex overflow-hidden rounded-md border border-border bg-white shadow-lg">
          <div className="flex w-[112px] shrink-0 flex-col border-r border-border py-2">
            {builtinPresets.map((preset) => {
              const active = draft.start === preset.start && draft.end === preset.end;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={cn(
                    "px-4 py-2.5 text-left text-body transition hover:bg-bg-hover",
                    active ? "bg-primary-subtle text-primary" : "text-text-primary",
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="flex gap-4 p-4">
            <MonthPanel
              month={leftMonth}
              draftStart={draftStart}
              draftEnd={draftEnd}
              pendingStart={pendingStart}
              onDayClick={handleDayClick}
              onPrevMonth={() => setLeftMonth((current) => addMonths(current, -1))}
              onNextMonth={() => setLeftMonth((current) => addMonths(current, 1))}
              onPrevYear={() => setLeftMonth((current) => addYears(current, -1))}
              onNextYear={() => setLeftMonth((current) => addYears(current, 1))}
            />
            <MonthPanel
              month={rightMonth}
              draftStart={draftStart}
              draftEnd={draftEnd}
              pendingStart={pendingStart}
              onDayClick={handleDayClick}
              onPrevMonth={() => setRightMonth((current) => addMonths(current, -1))}
              onNextMonth={() => setRightMonth((current) => addMonths(current, 1))}
              onPrevYear={() => setRightMonth((current) => addYears(current, -1))}
              onNextYear={() => setRightMonth((current) => addYears(current, 1))}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
