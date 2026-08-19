import { useEffect, useState, useMemo } from 'react';
import { 
  Shield, Check, RotateCcw, Save, Search, CheckSquare, Square, 
  Layers, Users, FileText, Calendar, ClipboardCheck, Award, 
  Settings, Building2, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { policyService } from '@/plugins/api';
import type { Policy, RoleWithPolicies } from '@/types/api';

const CATEGORY_META: Record<string, { label: string; icon: any; color: string }> = {
  DASHBOARD: { label: 'Bảng điều khiển & Thống kê', icon: Layers, color: 'text-blue-500 bg-blue-50 border-blue-200' },
  TOPIC: { label: 'Quản lý Đề tài & Phê duyệt', icon: FileText, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
  GROUP: { label: 'Quản lý Nhóm sinh viên', icon: Users, color: 'text-purple-500 bg-purple-50 border-purple-200' },
  ROUND: { label: 'Quản lý Đợt KLTN & Quy định', icon: Calendar, color: 'text-amber-500 bg-amber-50 border-amber-200' },
  REPORT: { label: 'Báo cáo tiến độ & Hướng dẫn', icon: ClipboardCheck, color: 'text-teal-500 bg-teal-50 border-teal-200' },
  COUNCIL: { label: 'Hội đồng bảo vệ & Điểm số', icon: Award, color: 'text-rose-500 bg-rose-50 border-rose-200' },
  ORGANIZATION: { label: 'Đào tạo & Cơ cấu tổ chức', icon: Building2, color: 'text-indigo-500 bg-indigo-50 border-indigo-200' },
  SYSTEM: { label: 'Hệ thống & Phân quyền', icon: Settings, color: 'text-slate-500 bg-slate-50 border-slate-200' },
  OTHER: { label: 'Chính sách khác', icon: Shield, color: 'text-gray-500 bg-gray-50 border-gray-200' },
};

export function PolicyManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<RoleWithPolicies[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [groupedPolicies, setGroupedPolicies] = useState<Record<string, Policy[]>>({});
  
  // State chứa các mã policy đang được chọn cho role hiện tại
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);
  const [originalPolicies, setOriginalPolicies] = useState<string[]>([]);
  
  // Tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  // Thông báo
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [policiesData, rolesData] = await Promise.all([
        policyService.getPolicies(),
        policyService.getRolesWithPolicies(),
      ]);

      setPolicies(policiesData.policies);
      setGroupedPolicies(policiesData.grouped);
      setRoles(rolesData);

      if (rolesData.length > 0 && selectedRoleId === null) {
        // Mặc định chọn role đầu tiên
        const firstRole = rolesData[0];
        setSelectedRoleId(firstRole.id);
        setSelectedPolicies([...firstRole.policies]);
        setOriginalPolicies([...firstRole.policies]);
      }
    } catch (error: any) {
      console.error('Error loading policies:', error);
      setAlert({ type: 'error', message: 'Lỗi khi tải danh sách chính sách: ' + (error.message || 'Lỗi server') });
    } finally {
      setLoading(false);
    }
  };

  // Khi chuyển role
  const handleSelectRole = (roleId: number) => {
    setSelectedRoleId(roleId);
    const targetRole = roles.find((r) => r.id === roleId);
    if (targetRole) {
      setSelectedPolicies([...targetRole.policies]);
      setOriginalPolicies([...targetRole.policies]);
    }
    setAlert(null);
  };

  const selectedRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId);
  }, [roles, selectedRoleId]);

  // Toggle 1 policy
  const handleTogglePolicy = (code: string) => {
    setSelectedPolicies((prev) => {
      if (prev.includes(code)) {
        return prev.filter((c) => c !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  // Toggle all policies in a category
  const handleToggleCategory = (category: string) => {
    const catPolicies = groupedPolicies[category] || [];
    const catCodes = catPolicies.map((p) => p.code);
    const allSelected = catCodes.every((code) => selectedPolicies.includes(code));

    if (allSelected) {
      // Bỏ chọn toàn bộ trong category
      setSelectedPolicies((prev) => prev.filter((c) => !catCodes.includes(c)));
    } else {
      // Chọn tất cả trong category
      setSelectedPolicies((prev) => Array.from(new Set([...prev, ...catCodes])));
    }
  };

  // Chọn tất cả policies
  const handleSelectAll = () => {
    const allCodes = policies.map((p) => p.code);
    setSelectedPolicies(allCodes);
  };

  // Bỏ chọn tất cả
  const handleDeselectAll = () => {
    setSelectedPolicies([]);
  };

  // Đặt lại theo DB
  const handleReset = () => {
    setSelectedPolicies([...originalPolicies]);
    setAlert(null);
  };

  // Lưu thay đổi
  const handleSave = async () => {
    if (!selectedRoleId) return;
    try {
      setSaving(true);
      setAlert(null);
      await policyService.updateRolePolicies(selectedRoleId, selectedPolicies);
      
      // Update local state
      setOriginalPolicies([...selectedPolicies]);
      setRoles((prev) =>
        prev.map((r) => (r.id === selectedRoleId ? { ...r, policies: [...selectedPolicies] } : r))
      );

      setAlert({
        type: 'success',
        message: `Đã lưu thành công ${selectedPolicies.length} quyền cho vai trò ${selectedRole?.role_name || ''}!`,
      });
    } catch (error: any) {
      console.error('Save role policies error:', error);
      setAlert({
        type: 'error',
        message: 'Lỗi khi lưu phân quyền: ' + (error.message || 'Lỗi server'),
      });
    } finally {
      setSaving(false);
    }
  };

  // Lọc policies theo tìm kiếm
  const filteredGrouped = useMemo(() => {
    if (!searchTerm.trim()) return groupedPolicies;
    const term = searchTerm.toLowerCase();
    const result: Record<string, Policy[]> = {};

    Object.keys(groupedPolicies).forEach((cat) => {
      const matched = groupedPolicies[cat].filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.code.toLowerCase().includes(term) ||
          (p.description && p.description.toLowerCase().includes(term))
      );
      if (matched.length > 0) {
        result[cat] = matched;
      }
    });
    return result;
  }, [groupedPolicies, searchTerm]);

  const hasChanges = useMemo(() => {
    if (selectedPolicies.length !== originalPolicies.length) return true;
    const sortedSel = [...selectedPolicies].sort();
    const sortedOrig = [...originalPolicies].sort();
    return sortedSel.some((code, idx) => code !== sortedOrig[idx]);
  }, [selectedPolicies, originalPolicies]);

  return (
    <PageLayout
      userRole="admin"
      title="Quản Lý Phân Quyền Vai Trò (Policy Management)"
      subtitle="Cấu hình ma trận chính sách và phân quyền chi tiết cho từng vai trò trong hệ thống theo kiến trúc LMS"
    >
      <div className="space-y-6">
        {/* Thanh chuyển đổi vai trò (Role Tabs) */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-base font-semibold">Chọn vai trò cần cấu hình</CardTitle>
                <CardDescription className="text-xs">
                  Chọn một vai trò để xem và tùy chỉnh danh sách chính sách được phép truy cập
                </CardDescription>
              </div>

              {/* Badges thông tin role */}
              {selectedRole && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="px-3 py-1 font-medium bg-background text-sm">
                    Mã role: <span className="font-bold text-primary ml-1">{selectedRole.role_code}</span>
                  </Badge>
                  <Badge className="px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 text-sm">
                    Đã bật: <span className="font-bold ml-1">{selectedPolicies.length}/{policies.length}</span> quyền
                  </Badge>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {roles.map((role) => {
                const isSelected = role.id === selectedRoleId;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleSelectRole(role.id)}
                    className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                        : 'border-border hover:border-primary/50 hover:bg-muted/30 bg-background'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-semibold text-sm line-clamp-1">{role.role_name}</span>
                      {isSelected && <Check className="w-4 h-4 text-primary shrink-0 ml-1" />}
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{role.role_code}</span>
                    <span className="text-[11px] text-muted-foreground mt-2">
                      {role.policies?.length || 0} quyền được gán
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Thanh công cụ tìm kiếm và thao tác nhanh */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-background p-4 rounded-lg border shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm chính sách, mã code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
            <Button variant="outline" size="sm" onClick={handleSelectAll} className="h-9 gap-1.5 text-xs">
              <CheckSquare className="w-3.5 h-3.5" />
              Chọn tất cả
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll} className="h-9 gap-1.5 text-xs">
              <Square className="w-3.5 h-3.5" />
              Bỏ chọn tất cả
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={!hasChanges}
              className="h-9 gap-1.5 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Đặt lại
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="h-9 gap-1.5 text-xs font-semibold shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>

        {/* Thông báo Alert */}
        {alert && (
          <div
            className={`p-3 rounded-lg flex items-center gap-3 border text-sm ${
              alert.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{alert.message}</span>
          </div>
        )}

        {/* Danh sách nhóm chính sách (Policy Groups) */}
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Đang tải danh mục chính sách...</div>
        ) : Object.keys(filteredGrouped).length === 0 ? (
          <div className="py-12 text-center text-muted-foreground border rounded-lg bg-background">
            Không tìm thấy chính sách phù hợp với từ khóa "{searchTerm}".
          </div>
        ) : (
          <div className="space-y-5">
            {Object.keys(filteredGrouped).map((category) => {
              const meta = CATEGORY_META[category] || CATEGORY_META.OTHER;
              const Icon = meta.icon;
              const catPolicies = filteredGrouped[category];
              const selectedInCat = catPolicies.filter((p) => selectedPolicies.includes(p.code)).length;
              const allInCatSelected = catPolicies.length > 0 && selectedInCat === catPolicies.length;

              return (
                <Card key={category} className="border shadow-sm overflow-hidden">
                  <CardHeader className="py-3 px-4 bg-muted/10 border-b flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-md border ${meta.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">{meta.label}</CardTitle>
                        <span className="text-xs text-muted-foreground">
                          {selectedInCat}/{catPolicies.length} quyền được bật
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleCategory(category)}
                      className="h-8 text-xs font-normal hover:bg-muted"
                    >
                      {allInCatSelected ? 'Bỏ chọn nhóm' : 'Chọn cả nhóm'}
                    </Button>
                  </CardHeader>

                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {catPolicies.map((policy) => {
                        const isChecked = selectedPolicies.includes(policy.code);
                        return (
                          <div
                            key={policy.code}
                            onClick={() => handleTogglePolicy(policy.code)}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer select-none transition-all ${
                              isChecked
                                ? 'border-primary/40 bg-primary/5'
                                : 'border-border/60 hover:border-border hover:bg-muted/20 bg-background'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // Handled by div onClick
                              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary shrink-0 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <span className="text-xs font-semibold text-foreground leading-tight">
                                  {policy.name}
                                </span>
                              </div>
                              <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {policy.code}
                              </span>
                              {policy.description && (
                                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                  {policy.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Floating Save Footer khi có thay đổi */}
        {hasChanges && (
          <div className="sticky bottom-6 z-10 flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Bạn có thay đổi chưa lưu cho vai trò "{selectedRole?.role_name}"</p>
                <p className="text-xs text-slate-300">
                  Đã chọn {selectedPolicies.length}/{policies.length} quyền
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-slate-300 hover:text-white hover:bg-slate-800">
                Hủy bỏ
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                <Save className="w-4 h-4 mr-1.5" />
                {saving ? 'Đang lưu...' : 'Lưu ngay'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
