import { useState } from 'react';
import { Search, Users, UserPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge, getStatusBadgeVariant } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ThesisGroup } from '@/types/api';

interface FindGroupTabProps {
  availableGroups: ThesisGroup[];
  onRequestJoin?: (groupId: number) => void;
}

export function FindGroupTab({
  availableGroups,
  onRequestJoin,
}: FindGroupTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredGroups = availableGroups.filter((group) => {
    const matchesSearch =
      !searchTerm.trim() ||
      (group.group_name && group.group_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (group.group_code && group.group_code.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      group.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên nhóm hoặc mã nhóm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="FORMING">Đang tìm thành viên (FORMING)</SelectItem>
                <SelectItem value="ACTIVE">Đã đủ thành viên (ACTIVE)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Group List */}
      <div className="space-y-4">
        {filteredGroups.length > 0 ? (
          filteredGroups.map((group) => {
            const memberCount = group.thesis_group_members?.length || 0;
            const maxMembers = group.max_members || 1;
            const isFull = memberCount >= maxMembers;

            return (
              <Card key={group.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-base">{group.group_name || 'Nhóm đồ án'}</h4>
                        <Badge variant={getStatusBadgeVariant(group.status)}>
                          {group.status === 'FORMING' ? 'Đang tìm thành viên' : group.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Mã nhóm: <span className="font-mono text-foreground font-medium">{group.group_code || group.id}</span>
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          <span>
                            Thành viên:{' '}
                            <span className="text-foreground font-medium">
                              {memberCount}/{maxMembers}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {onRequestJoin && !isFull && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRequestJoin(group.id)}
                      >
                        <UserPlus className="w-4 h-4 mr-1.5" />
                        Gửi yêu cầu gia nhập
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Không tìm thấy nhóm phù hợp</h3>
              <p className="text-muted-foreground text-sm">
                {searchTerm || statusFilter !== 'all'
                  ? 'Thử thay đổi bộ lọc tìm kiếm của bạn.'
                  : 'Hiện tại không có nhóm nào đang mở tìm kiếm thành viên.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
