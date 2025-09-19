// 登录表单组件
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { useAuth } from '../hooks/useAuth';

/**
 * 登录表单验证 Schema
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, '请输入邮箱')
    .email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(1, '请输入密码')
    .min(6, '密码至少需要 6 个字符'),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * 登录表单组件属性
 */
interface LoginFormProps {
  onSuccess?: () => void;
  className?: string;
}

/**
 * 登录表单组件
 */
export function LoginForm({ onSuccess, className }: LoginFormProps) {
  const { login, isLoginPending, resetLoginError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      // 清除之前的错误
      resetLoginError();
      
      // 执行登录
      await login(data);
      
      // 登录成功回调
      onSuccess?.();
      
      // 重置表单
      reset();
    } catch (error) {
      // 错误已在 useAuth 中处理
      console.error('Login failed:', error);
    }
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            邮箱
          </label>
          <Input
            id="email"
            type="email"
            placeholder="请输入邮箱"
            {...register('email')}
            error={!!errors.email}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            密码
          </label>
          <Input
            id="password"
            type="password"
            placeholder="请输入密码"
            {...register('password')}
            error={!!errors.password}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={!isValid || isLoginPending}
          loading={isLoginPending}
        >
          {isLoginPending ? '登录中...' : '登录'}
        </Button>
      </form>
    </div>
  );
}

/**
 * 注册表单验证 Schema
 */
const registerSchema = z.object({
  name: z
    .string()
    .min(1, '请输入姓名')
    .min(2, '姓名至少需要 2 个字符')
    .max(50, '姓名不能超过 50 个字符'),
  email: z
    .string()
    .min(1, '请输入邮箱')
    .email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(1, '请输入密码')
    .min(6, '密码至少需要 6 个字符')
    .max(100, '密码不能超过 100 个字符'),
  confirmPassword: z
    .string()
    .min(1, '请确认密码'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * 注册表单组件属性
 */
interface RegisterFormProps {
  onSuccess?: () => void;
  className?: string;
}

/**
 * 注册表单组件
 */
export function RegisterForm({ onSuccess, className }: RegisterFormProps) {
  const { register: registerUser, isRegisterPending, resetRegisterError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      // 清除之前的错误
      resetRegisterError();
      
      // 执行注册
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      
      // 注册成功回调
      onSuccess?.();
      
      // 重置表单
      reset();
    } catch (error) {
      // 错误已在 useAuth 中处理
      console.error('Register failed:', error);
    }
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            姓名
          </label>
          <Input
            id="name"
            type="text"
            placeholder="请输入姓名"
            {...register('name')}
            error={!!errors.name}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-destructive">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="register-email" className="block text-sm font-medium mb-1">
            邮箱
          </label>
          <Input
            id="register-email"
            type="email"
            placeholder="请输入邮箱"
            {...register('email')}
            error={!!errors.email}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="register-password" className="block text-sm font-medium mb-1">
            密码
          </label>
          <Input
            id="register-password"
            type="password"
            placeholder="请输入密码"
            {...register('password')}
            error={!!errors.password}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium mb-1">
            确认密码
          </label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="请再次输入密码"
            {...register('confirmPassword')}
            error={!!errors.confirmPassword}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={!isValid || isRegisterPending}
          loading={isRegisterPending}
        >
          {isRegisterPending ? '注册中...' : '注册'}
        </Button>
      </form>
    </div>
  );
}