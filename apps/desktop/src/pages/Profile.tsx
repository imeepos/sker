import { useState, useEffect } from 'react';
import { User, Lock, Camera, Save } from 'lucide-react';
import { useAuth, useUpdateUserInfo, useChangePassword } from '../shared/hooks/api/useAuth';
import { useToast } from '../shared/hooks/useToast';
import { useAuthStore } from '../shared/stores/auth';
import { Button } from '../shared/components/ui/Button';
import { Input } from '../shared/components/ui/Input';
import { Dialog } from '../shared/components/ui/Dialog';
import { ToastContainer } from '../shared/components/ui/Toast';

/**
 * 用户中心页面
 * 用于修改用户信息和密码
 */
export function Profile() {
  const { user } = useAuth();
  const { toasts, success, error, closeToast } = useToast();
  const { setUser } = useAuthStore();
  const updateUserMutation = useUpdateUserInfo();
  const changePasswordMutation = useChangePassword();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // 用户信息表单状态
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });

  // 修改密码表单状态
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 当用户数据变化时更新表单
  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || '',
        email: user.email || '',
      });
    }
  }, [user]);

  // 处理用户信息更新
  const handleUpdateProfile = async () => {
    // 检查是否有修改
    const hasChanges = 
      profileForm.username !== user?.username || 
      profileForm.email !== user?.email;

    if (!hasChanges) {
      error('无修改', '请先修改用户信息再保存');
      return;
    }

    // 基本验证
    if (!profileForm.username.trim()) {
      error('验证失败', '用户名不能为空');
      return;
    }

    if (!profileForm.email.trim()) {
      error('验证失败', '邮箱不能为空');
      return;
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileForm.email)) {
      error('验证失败', '请输入有效的邮箱地址');
      return;
    }

    const updateRequest = {
      username: profileForm.username !== user?.username ? profileForm.username : undefined,
      email: profileForm.email !== user?.email ? profileForm.email : undefined,
    };

    try {
      const updatedUser = await updateUserMutation.mutateAsync(updateRequest);
      
      // 手动更新本地用户状态
      setUser(updatedUser);
      
      setIsEditingProfile(false);
      success('更新成功', '用户信息已更新');
    } catch (err: any) {
      // 显示具体的错误信息
      const errorMessage = err?.message || '更新用户信息失败，请重试';
      error('更新失败', errorMessage);
    }
  };

  // 处理密码修改
  const handleChangePassword = async () => {
    // 验证表单
    if (!passwordForm.currentPassword.trim()) {
      error('验证失败', '请输入当前密码');
      return;
    }

    if (!passwordForm.newPassword.trim()) {
      error('验证失败', '请输入新密码');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      error('验证失败', '新密码和确认密码不匹配');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      error('验证失败', '新密码至少需要6个字符');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      error('验证失败', '新密码不能与当前密码相同');
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
      });
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsChangingPassword(false);
      success('修改成功', '密码已更新');
    } catch (err: any) {
      // 显示具体的错误信息
      const errorMessage = err?.message || '修改密码失败，请检查当前密码是否正确';
      error('修改失败', errorMessage);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">用户信息加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">个人中心</h1>
        <p className="text-gray-600 mt-2">管理您的账户信息和安全设置</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 用户头像区域 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center mx-auto">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-600" />
                  )}
                </div>
                <button className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">{user.username}</h3>
              <p className="text-gray-500">{user.email}</p>
              <p className="text-sm text-gray-400 mt-2">
                注册时间: {new Date(user.created_at).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>
        </div>

        {/* 用户信息和设置区域 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本信息 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">基本信息</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // 打开对话框时重置表单为当前用户信息
                  setProfileForm({
                    username: user?.username || '',
                    email: user?.email || '',
                  });
                  setIsEditingProfile(true);
                }}
              >
                编辑信息
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  用户名
                </label>
                <div className="text-gray-900">{user.username}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱地址
                </label>
                <div className="text-gray-900">{user.email}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  用户ID
                </label>
                <div className="text-gray-500 text-sm font-mono">{user.user_id}</div>
              </div>
            </div>
          </div>

          {/* 安全设置 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">安全设置</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChangingPassword(true)}
              >
                <Lock className="w-4 h-4 mr-2" />
                修改密码
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  登录密码
                </label>
                <div className="text-gray-500">••••••••</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  最后更新
                </label>
                <div className="text-gray-500">
                  {new Date(user.updated_at).toLocaleString('zh-CN')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 编辑用户信息对话框 */}
      <Dialog
        isOpen={isEditingProfile}
        onClose={() => setIsEditingProfile(false)}
        title="编辑用户信息"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              用户名
            </label>
            <Input
              type="text"
              value={profileForm.username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
              placeholder="请输入用户名"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              邮箱地址
            </label>
            <Input
              type="email"
              value={profileForm.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="请输入邮箱地址"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={() => setIsEditingProfile(false)} disabled={updateUserMutation.isPending}>
            取消
          </Button>
          <Button onClick={handleUpdateProfile} disabled={updateUserMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateUserMutation.isPending ? '保存中...' : '保存'}
          </Button>
        </div>
      </Dialog>

      {/* 修改密码对话框 */}
      <Dialog
        isOpen={isChangingPassword}
        onClose={() => setIsChangingPassword(false)}
        title="修改密码"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              当前密码
            </label>
            <Input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
              placeholder="请输入当前密码"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              新密码
            </label>
            <Input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              placeholder="请输入新密码"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              确认新密码
            </label>
            <Input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="请再次输入新密码"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={() => setIsChangingPassword(false)} disabled={changePasswordMutation.isPending}>
            取消
          </Button>
          <Button onClick={handleChangePassword} disabled={changePasswordMutation.isPending}>
            <Lock className="w-4 h-4 mr-2" />
            {changePasswordMutation.isPending ? '修改中...' : '修改密码'}
          </Button>
        </div>
      </Dialog>

      {/* Toast通知 */}
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
}