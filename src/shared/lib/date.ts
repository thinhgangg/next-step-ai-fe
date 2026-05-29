const MS_PER_DAY = 24 * 60 * 60 * 1000;

type FormatRelativeDateOptions = {
  fallback?: string;
  todayLabel?: string;
  yesterdayLabel?: string;
};

function getLocalDayNumber(date: Date) {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) /
      MS_PER_DAY,
  );
}

export function formatRelativeDate(
  value?: string | null,
  options: FormatRelativeDateOptions = {},
) {
  const {
    fallback = "Mới cập nhật",
    todayLabel = "Hôm nay",
    yesterdayLabel = "1 ngày trước",
  } = options;

  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  const diffDays = Math.max(
    0,
    getLocalDayNumber(new Date()) - getLocalDayNumber(date),
  );

  if (diffDays === 0) return todayLabel;
  if (diffDays === 1) return yesterdayLabel;
  return `${diffDays} ngày trước`;
}
