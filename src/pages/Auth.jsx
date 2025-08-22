import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, User, Store, Shield } from "lucide-react";
import { AuthRedirect } from "@/components/AuthRedirect";
import PasswordStrength from "@/components/PasswordStrength";

const validators = {
  // MIN 2, MAX 60 (previously showed an error if < 20)
  name: (v) =>
    v.trim().length < 2
      ? "Name must be at least 2 characters"
      : v.trim().length > 60
      ? "Name must not exceed 60 characters"
      : "",
  address: (v) => (v.length > 400 ? "Address must not exceed 400 characters" : ""),
  password: (v) => {
    if (v.length < 8 || v.length > 16) return "Password must be 8-16 characters";
    if (!/[A-Z]/.test(v)) return "Password must contain at least one uppercase letter";
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(v)) return "Password must contain at least one special character";
    return "";
  },
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Please enter a valid email address"),
};

function Field({ id, label, children, error, className }) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="text-sm text-gray-700">{label}</Label>
      {children}
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  show,
  setShow,
  placeholder = "••••••••",
  required = false,
}) {
  return (
    <div className="relative mt-1">
      <Input
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
      />
      <button
        type="button"
        aria-label="Toggle password"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
        onClick={() => setShow((s) => !s)}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, user, profile } = useAuth();

  // which "page": login or signup (sync with hash)
  const initialTab = useMemo(() => {
    const h = (location.hash || "").replace("#", "");
    return h === "signup" ? "signup" : "login";
  }, [location.hash]);

  const [tab, setTab] = useState(initialTab);
  useEffect(() => {
    const h = (location.hash || "").replace("#", "");
    if ((h === "login" || h === "signup") && h !== tab) setTab(h);
  }, [location.hash, tab]);

  // reflect tab changes into URL hash so you can deep-link
  useEffect(() => {
    const targetHash = `#${tab}`;
    if (location.hash !== targetHash) {
      // replace to avoid polluting history on tab switch
      navigate({ hash: targetHash }, { replace: true });
    }
  }, [tab, navigate, location.hash]);

  // loading flags split per form
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  // independent visibility toggles
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    role: "user",
  });
  const [errors, setErrors] = useState({});

  // redirect when logged in
  useEffect(() => {
    if (user && profile) {
      const from = location.state && location.state.from;
      if (from && from !== "/auth") {
        navigate(from, { replace: true });
      } else {
        switch (profile.role) {
          case "admin":
            navigate("/admin/dashboard", { replace: true });
            break;
          case "store_owner":
            navigate("/owner/dashboard", { replace: true });
            break;
          case "user":
          default:
            navigate("/stores", { replace: true });
            break;
        }
      }
    }
  }, [user, profile, navigate, location.state]);

  if (user && profile) return <AuthRedirect />;

  // login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setErrors({});

    const emailErr = validators.email(loginForm.email);
    if (emailErr) {
      setErrors({ email: emailErr });
      setIsLoggingIn(false);
      return;
    }

    try {
      const result = await signIn(loginForm.email, loginForm.password);
      const { error, user: signedInUser } = result || {};

      if (error) {
        toast({
          title: "Login failed",
          description: error.message || "Unable to login.",
          variant: "destructive",
        });
      } else {
        const name = signedInUser?.name ?? profile?.name;
        toast({
          title: "Welcome back!",
          description: name
            ? `You have been successfully logged in, ${name}.`
            : "You have been successfully logged in.",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // signup handler
  const handleSignup = async (e) => {
    e.preventDefault();
    setIsSigningUp(true);
    setErrors({});

    const newErrors = {};
    const nErr = validators.name(signupForm.name);
    if (nErr) newErrors.name = nErr;
    const emErr = validators.email(signupForm.email);
    if (emErr) newErrors.email = emErr;
    const pwErr = validators.password(signupForm.password);
    if (pwErr) newErrors.password = pwErr;
    if (signupForm.password !== signupForm.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (signupForm.address) {
      const aErr = validators.address(signupForm.address);
      if (aErr) newErrors.address = aErr;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSigningUp(false);
      return;
    }

    try {
      const result = await signUp(signupForm.email, signupForm.password, {
        name: signupForm.name.trim(),
        address: signupForm.address.trim(),
        role: signupForm.role,
      });
      const { error, user: newUser } = result || {};

      if (error) {
        toast({
          title: "Signup failed",
          description: error.message || "Unable to create account.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
        if (newUser?.name)
          toast({ title: "Welcome!", description: `Welcome, ${newUser.name}!` });
        // Optionally switch to login after successful signup:
        setTab("login");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err?.message ?? "An unexpected error occurred during signup.",
        variant: "destructive",
      });
    } finally {
      setIsSigningUp(false);
    }
  };

  // render
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow">
        <CardHeader className="text-center p-6">
          <div className="mx-auto mb-3 w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
            <span className="font-bold text-lg text-gray-700">SR</span>
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            StoreRatings
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            Simple sign in / sign up
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid grid-cols-2 gap-2 mb-4">
              <TabsTrigger value="login" className="px-3 py-2 rounded text-sm border">
                Login
              </TabsTrigger>
              <TabsTrigger value="signup" className="px-3 py-2 rounded text-sm border">
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* LOGIN */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <Field id="login-email" label="Email" error={errors.email}>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginForm.email}
                    onChange={(e) =>
                      setLoginForm((p) => ({ ...p, email: e.target.value }))
                    }
                    className="mt-1"
                    required
                  />
                </Field>

                <Field id="login-password" label="Password">
                  <PasswordInput
                    id="login-password"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm((p) => ({ ...p, password: e.target.value }))
                    }
                    show={showLoginPassword}
                    setShow={setShowLoginPassword}
                    required
                  />
                </Field>
                <Button 
                    type="submit" 
                    className="w-full h-11 text-base font-medium bg-blue-600 hover:bg-blue-700" 
                    disabled={isSigningUp}
                  >
                    {isSigningUp? "Signing in..." : "Sign in"}
                  </Button>
              </form>
            </TabsContent>

            {/* SIGNUP */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <Field id="signup-name" label="Full name" error={errors.name}>
                  <Input
                    id="signup-name"
                    value={signupForm.name}
                    onChange={(e) =>
                      setSignupForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="Your full name"
                    className="mt-1"
                    required
                  />
                </Field>

                <Field id="signup-email" label="Email" error={errors.email}>
                  <Input
                    id="signup-email"
                    value={signupForm.email}
                    onChange={(e) =>
                      setSignupForm((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="you@example.com"
                    className="mt-1"
                    required
                  />
                </Field>

                <Field id="signup-password" label="Password" error={errors.password}>
                  <PasswordInput
                    id="signup-password"
                    value={signupForm.password}
                    onChange={(e) =>
                      setSignupForm((p) => ({ ...p, password: e.target.value }))
                    }
                    show={showSignupPassword}
                    setShow={setShowSignupPassword}
                    placeholder="8–16 chars, 1 upper, 1 special"
                    required
                  />
                  <PasswordStrength password={signupForm.password} />
                </Field>

                <Field
                  id="confirm-password"
                  label="Confirm password"
                  error={errors.confirmPassword}
                >
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={signupForm.confirmPassword}
                      onChange={(e) =>
                        setSignupForm((p) => ({
                          ...p,
                          confirmPassword: e.target.value,
                        }))
                      }
                      placeholder="Repeat password"
                      className={`mt-1 pr-10 ${
                        signupForm.password &&
                        signupForm.confirmPassword &&
                        signupForm.password !== signupForm.confirmPassword
                          ? "border-red-500"
                          : ""
                      } ${
                        signupForm.password &&
                        signupForm.confirmPassword &&
                        signupForm.password === signupForm.confirmPassword
                          ? "border-green-500"
                          : ""
                      }`}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowConfirmPassword((s) => !s)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {signupForm.password && signupForm.confirmPassword && (
                    <p
                      className={`mt-1 text-xs ${
                        signupForm.password === signupForm.confirmPassword
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {signupForm.password === signupForm.confirmPassword
                        ? "Passwords match!"
                        : "Passwords do not match"}
                    </p>
                  )}
                </Field>

                <Field id="signup-address" label="Address (optional)" error={errors.address}>
                  <Textarea
                    id="signup-address"
                    value={signupForm.address}
                    onChange={(e) =>
                      setSignupForm((p) => ({ ...p, address: e.target.value }))
                    }
                    className="mt-1"
                    rows={3}
                    maxLength={400}
                  />
                </Field>

                <Field id="signup-role" label="Account type" className="mb-4">
                  <div className="space-y-2">
                    <Select 
                      value={signupForm.role} 
                      onValueChange={(value) => setSignupForm((p) => ({ ...p, role: value }))}
                    >
                      <SelectTrigger className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900">
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg">
                        <SelectItem 
                          value="user" 
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-gray-900"
                        >
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <span>Customer</span>
                          </div>
                        </SelectItem>
                        <SelectItem 
                          value="store_owner" 
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-gray-900"
                        >
                          <div className="flex items-center space-x-2">
                            <Store className="h-4 w-4 text-green-600" />
                            <span>Store Owner</span>
                          </div>
                        </SelectItem>
                        <SelectItem 
                          value="admin" 
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-gray-900"
                        >
                          <div className="flex items-center space-x-2">
                            <Shield className="h-4 w-4 text-purple-600" />
                            <span>Administrator</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      {signupForm.role === 'user' && 'Create a customer account to browse and rate stores'}
                      {signupForm.role === 'store_owner' && 'Register as a store owner to manage your business'}
                      {signupForm.role === 'admin' && 'Admin access for platform management'}
                    </p>
                  </div>
                </Field>

                <Button type="submit" className="w-full h-11 text-base font-medium bg-blue-600 hover:bg-blue-700" disabled={isSigningUp}>
                    {isSigningUp ? "Creating account..." : "Create Account"}
                  </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
