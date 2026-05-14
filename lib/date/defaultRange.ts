function formatDateInputValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);

  return localDate.toISOString().slice(0, 10);
}

function addMonths(date: Date, amount: number) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + amount);

  return nextDate;
}

export function getDefaultSearchDateRange(now = new Date()) {
  return {
    endDate: formatDateInputValue(now),
    startDate: formatDateInputValue(addMonths(now, -1)),
  };
}

export function getInitialSearchDateRange(items: Array<{ searchDate?: string }>, now = new Date()) {
  const defaultRange = getDefaultSearchDateRange(now);
  const dates = items
    .map((item) => item.searchDate)
    .filter((searchDate): searchDate is string => Boolean(searchDate))
    .sort();

  if (dates.length === 0) {
    return defaultRange;
  }

  const firstDate = dates[0] ?? defaultRange.startDate;
  const lastDate = dates[dates.length - 1] ?? defaultRange.endDate;
  const parsedLastDate = new Date(`${lastDate}T00:00:00`);

  if (Number.isNaN(parsedLastDate.getTime())) {
    return {
      endDate: lastDate,
      startDate: firstDate,
    };
  }

  const oneMonthBeforeLastDate = formatDateInputValue(addMonths(parsedLastDate, -1));

  return {
    endDate: lastDate,
    startDate: firstDate > oneMonthBeforeLastDate ? firstDate : oneMonthBeforeLastDate,
  };
}

export function getDefaultSearchMonthRange(now = new Date()) {
  const range = getDefaultSearchDateRange(now);

  return {
    endMonth: range.endDate.slice(0, 7),
    startMonth: range.startDate.slice(0, 7),
  };
}

export function getInitialSearchMonthRange(items: Array<{ searchDate?: string }>, now = new Date()) {
  const range = getInitialSearchDateRange(items, now);

  return {
    endMonth: range.endDate.slice(0, 7),
    startMonth: range.startDate.slice(0, 7),
  };
}
