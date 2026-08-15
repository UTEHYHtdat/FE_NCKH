import { Modal } from './ui/Modal';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { User, Shield, Calendar, MapPin, Clock, Users, Crown, FileText } from 'lucide-react';
import type { Council } from '@/types/api';
import { translateStatus, getStatusBadgeVariant } from '@/helpers/constant';

interface ModalCouncilDetailProps {
  isOpen: boolean;
  onClose: () => void;
  council: Council | null;
}

export function ModalCouncilDetail({ isOpen, onClose, council }: ModalCouncilDetailProps) {
  if (!council) return null;

  const chairman = council.instructors_defense_councils_chairman_idToinstructors;
  const secretary = council.instructors_defense_councils_secretary_idToinstructors;
  const members = council.council_members || [];
  const thesisRound = council.thesis_rounds;


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết hội đồng" size="lg">
      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Thông tin chung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Mã hội đồng</p>
                <p className="font-medium">{council.council_code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tên hội đồng</p>
                <p className="font-medium">{council.council_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Trạng thái</p>
                <Badge variant={getStatusBadgeVariant(council.status)}>
                  {translateStatus(council.status)}
                </Badge>
              </div>
              {thesisRound && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Đợt đồ án</p>
                  <p className="font-medium">{thesisRound.round_name} ({thesisRound.round_code})</p>
                </div>
              )}
            </div>
            {council.notes && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-1">Ghi chú</p>
                <p className="text-sm">{council.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Defense Information */}
        {(council.defense_date || council.venue || council.start_time || council.end_time) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Thông tin bảo vệ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {council.defense_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Ngày bảo vệ</p>
                      <p className="font-medium">
                        {council.defense_date ? new Date(council.defense_date).toLocaleDateString('vi-VN') : ''}
                      </p>
                    </div>
                  </div>
                )}
                {council.venue && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Địa điểm</p>
                      <p className="font-medium">{council.venue}</p>
                    </div>
                  </div>
                )}
                {council.start_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Giờ bắt đầu</p>
                      <p className="font-medium">
                        {council.start_time ? new Date(council.start_time).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit', timeZone: 'UTC'}) : ''}
                      </p>
                    </div>
                  </div>
                )}
                {council.end_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Giờ kết thúc</p>
                      <p className="font-medium">
                        {council.end_time ? new Date(council.end_time).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit', timeZone: 'UTC'}) : ''}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chairman */}
        {chairman && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-600" />
                Chủ tịch hội đồng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{chairman.users?.full_name || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">{chairman.instructor_code}</p>
                  <p className="text-sm text-muted-foreground">{chairman.users?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Secretary */}
        {secretary && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Thư ký hội đồng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{secretary.users?.full_name || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">{secretary.instructor_code}</p>
                  <p className="text-sm text-muted-foreground">{secretary.users?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Members */}
        {members.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Thành viên hội đồng ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {member.instructors?.users?.full_name || 'N/A'}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {member.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {member.instructors?.instructor_code}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.instructors?.users?.email}
                      </p>
                    </div>
                    {member.order_number && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Thứ tự</p>
                        <p className="font-medium">#{member.order_number}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Defense Assignments */}
        {council.defense_assignments && council.defense_assignments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Luận văn bảo vệ ({council.defense_assignments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {council.defense_assignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">
                        {assignment.theses?.topic_title || `Luận văn #${assignment.thesis_id}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {assignment.theses?.thesis_code}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Thứ tự</p>
                      <p className="font-medium">#{assignment.defense_order}</p>
                      <p className="text-sm text-muted-foreground">{assignment.defense_time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}
