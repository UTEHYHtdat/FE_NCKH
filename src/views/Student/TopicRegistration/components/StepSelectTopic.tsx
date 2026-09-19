import React, { useState } from 'react';
import { Search, Check, ChevronLeft, ChevronRight, FileText, PlusCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface StepSelectTopicProps {
  round: any;
  selectedInstructorInfo?: any;
  proposedTopics: any[];
  selectedTopic: number | null;
  topicMode: 'proposed' | 'self';
  selfProposedTitle: string;
  selfProposedDescription: string;
  selectionReason: string;
  onSelectTopic: (topicId: number) => void;
  onSetTopicMode: (mode: 'proposed' | 'self') => void;
  onSetSelfProposedTitle: (title: string) => void;
  onSetSelfProposedDescription: (desc: string) => void;
  onSetSelectionReason: (reason: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function StepSelectTopic({
  round,
  selectedInstructorInfo,
  proposedTopics,
  selectedTopic,
  topicMode,
  selfProposedTitle,
  selfProposedDescription,
  selectionReason,
  onSelectTopic,
  onSetTopicMode,
  onSetSelfProposedTitle,
  onSetSelfProposedDescription,
  onSetSelectionReason,
  onNext,
  onPrev,
}: StepSelectTopicProps) {
  const [topicSearch, setTopicSearch] = useState('');

  // Filter proposed topics by search keyword
  const filteredTopics = proposedTopics.filter((t) => {
    if (!topicSearch.trim()) return true;
    const term = topicSearch.toLowerCase();
    const title = (t.title || '').toLowerCase();
    const code = (t.code || '').toLowerCase();
    const desc = (t.description || '').toLowerCase();
    const techs = Array.isArray(t.technologies) ? t.technologies.join(' ').toLowerCase() : '';
    return title.includes(term) || code.includes(term) || desc.includes(term) || techs.includes(term);
  });

  const canProceed =
    topicMode === 'proposed'
      ? !!selectedTopic
      : selfProposedTitle.trim() !== '' && selfProposedDescription.trim() !== '';

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Bước 2: Chọn Đề tài hoặc Tự đề xuất
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            GVHD: <span className="font-medium text-foreground">{selectedInstructorInfo?.name || 'Đã chọn'}</span> • Đợt: <span className="font-medium text-foreground">{round.round_name}</span>
          </p>
        </div>
      </div>

      <Tabs value={topicMode} onValueChange={(val) => onSetTopicMode(val as 'proposed' | 'self')}>
        <TabsList className="grid grid-cols-2 max-w-md mb-6">
          <TabsTrigger value="proposed" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Đề tài GV đề xuất ({proposedTopics.length})
          </TabsTrigger>
          <TabsTrigger value="self" className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            Sinh viên tự đề xuất
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Đề tài của GV */}
        <TabsContent value="proposed" className="space-y-4 mt-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm đề tài theo tên, công nghệ, từ khóa..."
              className="pl-9"
              value={topicSearch}
              onChange={(e) => setTopicSearch(e.target.value)}
            />
          </div>

          {filteredTopics.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30 text-primary" />
                <p className="font-medium text-foreground mb-1">
                  {proposedTopics.length === 0
                    ? 'Giảng viên này hiện chưa có đề tài đề xuất nào cho đợt này'
                    : 'Không tìm thấy đề tài phù hợp với từ khóa'}
                </p>
                <p className="text-xs">
                  Bạn có thể chuyển sang tab <strong>"Sinh viên tự đề xuất"</strong> để đề xuất đề tài mà bạn mong muốn.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredTopics.map((topic) => {
                const isSelected = selectedTopic === topic.id;
                const isTaken = topic.isTaken;

                return (
                  <Card
                    key={topic.id}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? 'ring-2 ring-primary bg-primary/5 border-primary'
                        : 'hover:shadow-md'
                    } ${isTaken ? 'opacity-60 cursor-not-allowed' : ''}`}
                    onClick={() => !isTaken && onSelectTopic(topic.id)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <h3 className="font-semibold text-base text-foreground">
                              {topic.title}
                            </h3>
                            <Badge variant="outline" className="font-mono text-xs">
                              {topic.code}
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {topic.description || 'Không có mô tả chi tiết'}
                          </p>

                          <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                            {Array.isArray(topic.technologies) && topic.technologies.length > 0 && (
                              <div className="flex gap-1.5 flex-wrap">
                                {topic.technologies.map((tech: string) => (
                                  <Badge key={tech} variant="secondary" className="text-[11px] px-1.5 py-0">
                                    {tech}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <span>
                              Hình thức: <strong className="text-foreground">{topic.groupMode}</strong>
                            </span>
                            <span>
                              Số lượng: <strong className="text-foreground">{topic.minMembers}-{topic.maxMembers} SV</strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <Badge variant={isTaken ? 'outline' : 'default'} className="text-xs">
                            {isTaken ? 'Đã có nhóm chọn' : 'Còn trống'}
                          </Badge>
                          {isSelected && (
                            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white">
                              <Check className="w-4 h-4 stroke-[2.5]" />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Tự đề xuất đề tài */}
        <TabsContent value="self" className="mt-0">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-start gap-2.5 text-xs text-muted-foreground">
                <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>
                  Đề tài tự đề xuất cần được Giảng viên hướng dẫn thẩm định và Trưởng bộ môn phê duyệt trước khi chính thức thực hiện.
                </span>
              </div>

              <div>
                <Label htmlFor="self_title" className="text-sm font-medium">
                  Tên đề tài tự đề xuất <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="self_title"
                  placeholder="VD: Xây dựng hệ thống phát hiện xâm nhập mạng sử dụng Deep Learning..."
                  className="mt-1.5"
                  value={selfProposedTitle}
                  onChange={(e) => onSetSelfProposedTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="self_desc" className="text-sm font-medium">
                  Mô tả chi tiết nội dung đề tài <span className="text-destructive">*</span>
                </Label>
                <textarea
                  id="self_desc"
                  className="w-full mt-1.5 px-3 py-2 bg-background border border-input rounded-lg min-h-28 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Mô tả mục tiêu nghiên cứu, phạm vi ứng dụng, các công nghệ dự kiến sử dụng và kết quả mong đợi..."
                  value={selfProposedDescription}
                  onChange={(e) => onSetSelfProposedDescription(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="self_reason" className="text-sm font-medium">
                  Lý do lựa chọn đề tài & tính cấp thiết (Tùy chọn)
                </Label>
                <textarea
                  id="self_reason"
                  className="w-full mt-1.5 px-3 py-2 bg-background border border-input rounded-lg min-h-20 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Giải thích vì sao nhóm muốn thực hiện đề tài này, kinh nghiệm sẵn có..."
                  value={selectionReason}
                  onChange={(e) => onSetSelectionReason(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button variant="outline" onClick={onPrev}>
          <ChevronLeft className="w-4 h-4 mr-1.5" />
          Quay lại chọn GVHD
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          Tiếp tục: Xác nhận thông tin
          <ChevronRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}
