import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/UnifiedAppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BrandWordmark } from '@/components/BrandWordmark';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import SEO from '@/components/SEO';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password, 'default', rememberMe);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid email or password';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SEO
        title="Login"
        description="Sign in to your Xordon account to manage your outreach campaigns and analytics."
      />
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-10">
          <BrandWordmark
            className="mb-6 justify-center"
            style={{ fontSize: '10rem', lineHeight: '1' }}
            textClassName="text-foreground"
            casing="lower"
          />
        </div>

        <Card className="shadow-2xl border-white/5 overflow-hidden">
          <CardContent className="p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <Label htmlFor="remember" className="text-sm font-normal">
                    Remember me
                  </Label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="space-y-4 pt-2">
                <Button
                  type="submit"
                  className="w-full text-lg h-12 font-bold bg-white text-black hover:bg-gray-100 dark:bg-white dark:text-black transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <p className="text-sm text-gray-600 text-center">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Sign up free
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Demo: Use <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">demo@xordon.app</code> / <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">demo123</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
