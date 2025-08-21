import { useState, useEffect } from "react";
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
import { Eye, EyeOff } from "lucide-react";
import { AuthRedirect } from "@/components/AuthRedirect";

/**
 * Compressed Auth component — same behavior, smaller footprint.
 */

/* -----------------------
   Helpers & validators
   ----------------------- */
const validators = {
  name: (v) => (v.length < 20 ? "Name must be at least 20 characters" : v.length > 60 ? "Name must not exceed 60 characters" : ""),
  address: (v) => (v.length > 400 ? "Address must not exceed 400 characters" : ""),
  password: (v) => {
    if (v.length < 8 || v.length > 16) return "Password must be 8-16 characters";
    if (!/[A-Z]/.test(v)) return "Password must contain at least one uppercase letter";
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(v)) return "Password must contain at least one special character";
    return "";
  },
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Please enter a valid email address"),
};

/* Small presentational helpers to reduce repetition */
function Field({ id, label, children, error }) {
  return (
    <div>
      <Label htmlFor={id} className="text-sm text-gray-700">{label}</Label>
      {children}
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function PasswordInput({ id, value, onChange, showPassword, setShowPassword, placeholder = "••••••••", required = false }) {
  return (
    <div className="relative mt-1">
      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
      />
      <button
        type="button"
        aria-label="Toggle password"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
        onClick={() => setShowPassword((s) => !s)}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

/* -----------------------
   Component
   ----------------------- */
export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  /* Redirect when logged in (unchanged) */
  useEffect(() => {
    if (user && profile) {
      const from = location.state && location.state.from;
      if (from && from !== "/auth") navigate(from, { replace: true });
      else {
        switch (profile.role) {
          case "admin":
            navigate("/admin/dashboard", { replace: true }); break;
          case "store_owner":
            navigate("/owner/dashboard", { replace: true }); break;
          case "user":
          default:
            navigate("/stores", { replace: true }); break;
        }
      }
    }
  }, [user, profile, navigate, location]);

  if (user && profile) return <AuthRedirect />;

  /* -----------------------
     Handlers (behavior preserved)
     ----------------------- */
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    const emailErr = validators.email(loginForm.email);
    if (emailErr) { setErrors({ email: emailErr }); setIsLoading(false); return; }

    try {
      const result = await signIn(loginForm.email, loginForm.password);
      const { error, user: signedInUser } = result || {};

      if (error) {
        toast({ title: "Login failed", description: error.message || "Unable to login.", variant: "destructive" });
      } else {
        const name = signedInUser?.name ?? profile?.name;
        toast({
          title: "Welcome back!",
          description: name ? `You have been successfully logged in, ${name}.` : "You have been successfully logged in.",
        });
      }
    } catch (err) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const newErrors = {};
    const nErr = validators.name(signupForm.name); if (nErr) newErrors.name = nErr;
    const emErr = validators.email(signupForm.email); if (emErr) newErrors.email = emErr;
    const pwErr = validators.password(signupForm.password); if (pwErr) newErrors.password = pwErr;
    if (signupForm.password !== signupForm.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (signupForm.address) { const aErr = validators.address(signupForm.address); if (aErr) newErrors.address = aErr; }

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); setIsLoading(false); return; }

    try {
      const result = await signUp(signupForm.email, signupForm.password, {
        name: signupForm.name,
        address: signupForm.address,
        role: signupForm.role,
      });
      const { error, user: newUser } = result || {};

      if (error) {
        toast({ title: "Signup failed", description: error.message || "Unable to create account.", variant: "destructive" });
      } else {
        toast({ title: "Account created!", description: "Please check your email to verify your account." });
        if (newUser?.name) toast({ title: "Welcome!", description: `Welcome, ${newUser.name}!` });
      }
    } catch (err) {
      toast({ title: "Error", description: err?.message ?? "An unexpected error occurred during signup.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  /* -----------------------
     UI — reduced repetition using helpers
     ----------------------- */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow">
        <CardHeader className="text-center p-6">
          <div className="mx-auto mb-3 w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
            <span className="font-bold text-lg text-gray-700">SR</span>
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">StoreRatings</CardTitle>
          <CardDescription className="text-sm text-gray-500">Simple sign in / sign up</CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid grid-cols-2 gap-2 mb-4">
              <TabsTrigger value="login" className="px-3 py-2 rounded text-sm border">Login</TabsTrigger>
              <TabsTrigger value="signup" className="px-3 py-2 rounded text-sm border">Sign Up</TabsTrigger>
            </TabsList>

            {/* LOGIN */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <Field id="login-email" label="Email" error={errors.email}>
                  <Input id="login-email" type="email" placeholder="you@example.com" value={loginForm.email}
                    onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))} className="mt-1" required />
                </Field>

                <Field id="login-password" label="Password">
                  <PasswordInput id="login-password" value={loginForm.password}
                    onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                    showPassword={showPassword} setShowPassword={setShowPassword} required />
                </Field>

                <Button type="submit" className="w-full py-2 rounded bg-gray-900 text-white" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            {/* SIGNUP */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <Field id="signup-name" label="Full name" error={errors.name}>
                  <Input id="signup-name" value={signupForm.name}
                    onChange={(e) => setSignupForm((p) => ({ ...p, name: e.target.value }))} placeholder="Your full name" className="mt-1" required />
                </Field>

                <Field id="signup-email" label="Email" error={errors.email}>
                  <Input id="signup-email" value={signupForm.email}
                    onChange={(e) => setSignupForm((p) => ({ ...p, email: e.target.value }))} placeholder="you@example.com" className="mt-1" required />
                </Field>

                <Field id="signup-password" label="Password" error={errors.password}>
                  <PasswordInput id="signup-password" value={signupForm.password}
                    onChange={(e) => setSignupForm((p) => ({ ...p, password: e.target.value }))}
                    showPassword={showPassword} setShowPassword={setShowPassword} placeholder="8+ chars, 1 upper, 1 special" required />
                </Field>

                <Field id="confirm-password" label="Confirm password" error={errors.confirmPassword}>
                  <Input id="confirm-password" type="password" value={signupForm.confirmPassword}
                    onChange={(e) => setSignupForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="Repeat password" className="mt-1" required />
                </Field>

                <Field id="signup-address" label="Address (optional)" error={errors.address}>
                  <Textarea id="signup-address" value={signupForm.address}
                    onChange={(e) => setSignupForm((p) => ({ ...p, address: e.target.value }))}
                    className="mt-1" rows={3} maxLength={400} />
                </Field>

                <Field id="signup-role" label="Account type">
                  <Select value={signupForm.role} onValueChange={(value) => setSignupForm((p) => ({ ...p, role: value }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select account type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Customer</SelectItem>
                      <SelectItem value="store_owner">Store Owner</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Button type="submit" className="w-full py-2 rounded bg-gray-900 text-white" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
