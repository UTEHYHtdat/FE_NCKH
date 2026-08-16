export const STATUS_TRANSLATION: Record<string, string> = {
  // Thesis Rounds
  Preparing: 'Chuẩn bị',
  ACTIVE: 'Đã kích hoạt',
  Ongoing: 'Đang diễn ra',
  Completed: 'Hoàn thành',
  Cancelled: 'Đã hủy',
  
  // Councils & Schedules
  NOT_SCHEDULED: 'Chưa xếp lịch',
  PREPARING: 'Chuẩn bị',
  SCHEDULED: 'Đã lên lịch',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  IN_PROGRESS: 'Đang diễn ra',
  
  // Reports
  APPROVED: 'Đã duyệt',
  NEED_CHANGES: 'Cần sửa',
  PENDING: 'Chờ đánh giá',
  REJECTED: 'Bị từ chối',
};

export const translateStatus = (status: string): string => {
  if (!status) return '';
  return STATUS_TRANSLATION[status] || status;
};

export const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "READY":
    case "APPROVED":
    case "Completed":
    case "SCHEDULED":
      return "default";
    case "IN_PROGRESS":
    case "Ongoing":
      return "secondary";
    case "FORMING":
    case "Preparing":
    case "PREPARING":
    case "PENDING":
    case "NOT_SCHEDULED":
      return "outline";
    case "CANCELLED":
    case "Cancelled":
    case "REJECTED":
      return "destructive";
    default:
      return "default";
  }
};
