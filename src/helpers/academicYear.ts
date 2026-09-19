/**
 * Tiện ích tự động tính toán Năm học và Học kỳ theo quy chế đào tạo
 *
 * Quy tắc:
 * - Năm học bắt đầu từ Tháng 9 năm nay và kết thúc vào Tháng 5 năm sau (chuyển giao/hè: tháng 6 - 8).
 * - Tháng 9 đến Tháng 12: Bước vào năm học mới => [Năm hiện tại] - [Năm hiện tại + 1]
 * - Tháng 1 đến hết Tháng 8: Vẫn thuộc năm học cũ => [Năm hiện tại - 1] - [Năm hiện tại]
 */

/**
 * 1. Lấy năm bắt đầu của năm học dựa trên mốc ngày (mặc định là thời gian hiện tại)
 */
export const getAcademicStartYear = (date: Date = new Date()): number => {
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth() + 1; // getMonth(): 0 - 11 -> tháng: 1 - 12
  return currentMonth >= 9 ? currentYear : currentYear - 1;
};

/**
 * 2. Lấy chuỗi năm học hiện tại dạng "YYYY-YYYY"
 * Ví dụ:
 * - Tháng 9/2026 -> "2026-2027"
 * - Tháng 5/2026 -> "2025-2026"
 * - Tháng 8/2026 -> "2025-2026"
 */
export const getCurrentAcademicYear = (date: Date = new Date()): string => {
  const startYear = getAcademicStartYear(date);
  return `${startYear}-${startYear + 1}`;
};

/**
 * 3. Tự động sinh danh sách các Năm học cho thẻ <select> dropdown hoặc bộ lọc
 */
export const getAcademicYearOptions = (
  pastCount: number = 2,
  futureCount: number = 2,
  baseDate: Date = new Date()
) => {
  const currentStartYear = getAcademicStartYear(baseDate);
  const options: { value: string; label: string; isCurrent: boolean }[] = [];

  for (let i = -pastCount; i <= futureCount; i++) {
    const startYear = currentStartYear + i;
    const academicYearStr = `${startYear}-${startYear + 1}`;
    const isCurrent = i === 0;

    options.push({
      value: academicYearStr,
      label: isCurrent ? `${academicYearStr} (Hiện tại)` : academicYearStr,
      isCurrent,
    });
  }

  return options;
};

/**
 * 4. Tự động gợi ý Học kỳ hiện tại
 * - Tháng 9 đến tháng 1 năm sau: Học kỳ 1
 * - Tháng 2 đến tháng 5: Học kỳ 2
 * - Tháng 6 đến tháng 8: Học kỳ 3 (Học kỳ phụ / Hè)
 */
export const getCurrentSemester = (date: Date = new Date()): number => {
  const currentMonth = date.getMonth() + 1;
  if (currentMonth >= 9 || currentMonth === 1) {
    return 1;
  } else if (currentMonth >= 2 && currentMonth <= 5) {
    return 2;
  } else {
    return 3;
  }
};