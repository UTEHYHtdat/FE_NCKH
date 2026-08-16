import { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  User, 
  Shield, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Crown, 
  FileText, 
  BookOpen, 
  GraduationCap, 
  Info,
  Layers,
  Award,
  Loader2
} from 'lucide-react';
import type { Council } from '@/types/api';
import { councilService } from '@/plugins/api';
import { translateStatus, getStatusBadgeVariant } from '@/helpers/constant';

interface ModalCouncilDetailProps {
  isOpen: boolean;
  onClose: () => void;
  council: Council | null;
}

export function ModalCouncilDetail({ isOpen, onClose, council: initialCouncil }: ModalCouncilDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'theses'>('overview');
  const [council, setCouncil] = useState<Council | null>(initialCouncil);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && initialCouncil?.id) {
      setActiveTab('overview');
      const fetchFullCouncil = async () => {
        try {
          setLoading(true);
          const fullData = await councilService.getCouncilById(initialCouncil.id);
          const result = (fullData as any)?.data || fullData;
          setCouncil(result);
        } catch (error) {
          console.error('Error fetching full council detail:', error);
          setCouncil(initialCouncil);
        } finally {
          setLoading(false);
        }
      };
      fetchFullCouncil();
    } else {
      setCouncil(initialCouncil);
    }
  }, [isOpen, initialCouncil]);

  if (!council) return null;

  const chairman = council.instructors_defense_councils_chairman_idToinstructors;
  const secretary = council.instructors_defense_councils_secretary_idToinstructors;
  const members = council.council_members || [];
  const thesisRound = council.thesis_rounds;
  const defenseAssignments = council.defense_assignments || [];

  const totalMembers = (chairman ? 1 : 0) + (secretary ? 1 : 0) + members.length;

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    try {
      if (timeStr.includes('T') || timeStr.includes('Z')) {
        return new Date(timeStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
      }
      return timeStr.substring(0, 5);
    } catch {
      return timeStr;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Chưa xác định';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Chi tiết hội đồng: ${council.council_name}`} size="lg">
      <div className="space-y-6">
        {/* Header Summary Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-muted/40 rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base">{council.council_name}</span>
                <Badge variant="outline" className="font-mono text-xs">{council.council_code}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {thesisRound ? `${thesisRound.round_name} (${thesisRound.academic_year || ''})` : 'Chưa gán đợt'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(council.status)} className="px-3 py-1 text-xs">
              {translateStatus(council.status)}
            </Badge>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Tổng quan & Lịch hội đồng
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'members'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4" />
            Thành viên hội đồng ({totalMembers})
          </button>
          <button
            onClick={() => setActiveTab('theses')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'theses'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Lịch ca bảo vệ & Đề tài ({defenseAssignments.length})
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Đang tải thông tin chi tiết hội đồng...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: OVERVIEW & SCHEDULE */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                {/* Schedule details */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Lịch làm việc & Địa điểm tổ chức
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                        <Calendar className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Ngày bảo vệ</p>
                          <p className="font-semibold text-sm mt-0.5">{formatDate(council.defense_date)}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                        <Clock className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Khung giờ làm việc</p>
                          <p className="font-semibold text-sm mt-0.5">
                            {council.start_time || council.end_time 
                              ? `${formatTime(council.start_time) || '--:--'} đến ${formatTime(council.end_time) || '--:--'}`
                              : 'Chưa xếp giờ cụ thể'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/50 md:col-span-2">
                        <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Địa điểm / Phòng bảo vệ</p>
                          <p className="font-semibold text-sm mt-0.5">
                            {council.venue || 'Chưa xác định phòng bảo vệ'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {council.notes && (
                      <div className="mt-4 p-3 rounded-lg bg-blue-50/50 border border-blue-200/60 dark:bg-blue-950/20 dark:border-blue-900/50">
                        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                          <Info className="w-4 h-4" /> Ghi chú hội đồng
                        </div>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{council.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick stats cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-border bg-card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Thành viên HĐ</p>
                      <p className="text-lg font-bold">{totalMembers} thành viên</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-border bg-card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Số đề tài bảo vệ</p>
                      <p className="text-lg font-bold">{defenseAssignments.length} đề tài</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-border bg-card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Đợt khóa luận</p>
                      <p className="text-sm font-semibold truncate">{thesisRound?.round_name || 'Mặc định'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: COUNCIL MEMBERS */}
            {activeTab === 'members' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Chairman */}
                  <Card className="border-amber-200/70 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                          <Crown className="w-4 h-4" /> Chủ tịch hội đồng
                        </span>
                        <Badge variant="outline" className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300">
                          Chủ trì
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {chairman ? (
                        <div className="flex items-center gap-3.5 pt-1">
                          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 font-bold text-base">
                            <User className="w-6 h-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-base truncate">{chairman.users?.full_name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Mã GV: {chairman.instructor_code}</p>
                            <p className="text-xs text-muted-foreground truncate">{chairman.users?.email}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic py-2">Chưa phân công chủ tịch</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Secretary */}
                  <Card className="border-blue-200/70 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/10">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                          <FileText className="w-4 h-4" /> Thư ký hội đồng
                        </span>
                        <Badge variant="outline" className="border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300">
                          Ghi biên bản
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {secretary ? (
                        <div className="flex items-center gap-3.5 pt-1">
                          <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 font-bold text-base">
                            <User className="w-6 h-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-base truncate">{secretary.users?.full_name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Mã GV: {secretary.instructor_code}</p>
                            <p className="text-xs text-muted-foreground truncate">{secretary.users?.email}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic py-2">Chưa phân công thư ký</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Other Members */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Ủy viên & Thành viên khác ({members.length})
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {members.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Chưa có ủy viên nào khác trong hội đồng</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {members.map((member, index) => (
                          <div
                            key={member.id || index}
                            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                          >
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-sm">
                              {member.instructors?.users?.full_name ? member.instructors.users.full_name.charAt(0) : <User className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm truncate">
                                  {member.instructors?.users?.full_name || 'Giảng viên'}
                                </p>
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                  {member.role || 'Ủy viên'}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Mã: {member.instructors?.instructor_code || '---'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {member.instructors?.users?.email}
                              </p>
                            </div>
                            {member.order_number && (
                              <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                                #{member.order_number}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB 3: DEFENSE ASSIGNMENTS & TOPICS */}
            {activeTab === 'theses' && (
              <div className="space-y-4">
                {defenseAssignments.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                      <p className="font-medium text-base text-foreground">Chưa có đề tài nào được xếp lịch</p>
                      <p className="text-sm mt-1">Hội đồng này hiện chưa có đề tài khóa luận nào được phân công bảo vệ.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {defenseAssignments.map((assignment, index) => {
                      const thesis = assignment.theses;
                      const supervisor = thesis?.instructors?.users?.full_name || 'Chưa rõ';
                      const students = thesis?.thesis_members || [];

                      return (
                        <Card key={assignment.id || index} className="overflow-hidden border border-border hover:shadow-sm transition-shadow">
                          <div className="p-4 space-y-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 text-primary font-bold text-xs">
                                  #{assignment.defense_order || index + 1}
                                </span>
                                <div>
                                  <h4 className="font-semibold text-base text-foreground">
                                    {thesis?.topic_title || `Đề tài #${assignment.thesis_id}`}
                                  </h4>
                                  <p className="text-xs text-muted-foreground font-mono">
                                    Mã đề tài: {thesis?.thesis_code || 'N/A'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {assignment.defense_time && (
                                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                    <Clock className="w-3 h-3 text-muted-foreground" />
                                    {formatTime(assignment.defense_time)}
                                  </Badge>
                                )}
                                <Badge variant={getStatusBadgeVariant(assignment.status || 'PENDING')}>
                                  {translateStatus(assignment.status || 'PENDING')}
                                </Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50 text-xs">
                              {/* Students */}
                              <div>
                                <p className="text-muted-foreground font-medium mb-1 flex items-center gap-1">
                                  <GraduationCap className="w-3.5 h-3.5" /> Sinh viên thực hiện:
                                </p>
                                {students.length === 0 ? (
                                  <p className="italic text-muted-foreground">Chưa có thông tin sinh viên</p>
                                ) : (
                                  <div className="space-y-1">
                                    {students.map((member, sIdx) => (
                                      <div key={sIdx} className="flex items-center gap-1.5 font-medium">
                                        <span>• {member.students?.users?.full_name || 'Sinh viên'}</span>
                                        {member.students?.student_code && (
                                          <span className="text-muted-foreground">({member.students.student_code})</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Supervisor & Result */}
                              <div>
                                <p className="text-muted-foreground font-medium mb-1 flex items-center gap-1">
                                  <User className="w-3.5 h-3.5" /> Giảng viên hướng dẫn:
                                </p>
                                <p className="font-medium text-foreground">{supervisor}</p>
                                
                                {thesis?.defense_score !== undefined && thesis?.defense_score !== null && (
                                  <div className="mt-2 flex items-center gap-1.5 text-emerald-600 font-semibold">
                                    <Award className="w-3.5 h-3.5" />
                                    <span>Điểm bảo vệ: {thesis.defense_score}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div className="flex justify-end pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
