import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Container } from '../../components/layout/Container.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import { SITE_CONFIG } from '../../lib/siteConfig.js';
import { getDeviceId } from '../../lib/deviceId.js';
import { checkLoginLock, registerLoginFailure, registerLoginSuccess } from '../../lib/loginLockoutService.js';

const MAX_ATTEMPTS = 3;

export function AdminLogin() {
  const { status, signIn } = useAdminAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Lock state is always what the server last told us -- the countdown
  // below only ticks a client-side display value down for UX; when it
  // hits zero we re-check with the server rather than just trusting it.
  const [lockSecondsRemaining, setLockSecondsRemaining] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [checkingLock, setCheckingLock] = useState(true);
  const deviceIdRef = useRef(null);
  if (deviceIdRef.current === null) deviceIdRef.current = getDeviceId();

  useEffect(() => {
    let active = true;
    checkLoginLock(deviceIdRef.current)
      .then((res) => {
        if (!active) return;
        setLockSecondsRemaining(res.is_locked ? res.seconds_remaining : 0);
        setFailedCount(res.failed_count);
      })
      .catch(() => {
        // If the lock check itself fails (network blip, etc.), fail
        // open on the UI (don't block someone on a broken check) -- the
        // server-side RPCs still gate the actual signIn attempt below.
      })
      .finally(() => {
        if (active) setCheckingLock(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (lockSecondsRemaining <= 0) return undefined;
    const timer = setInterval(() => {
      setLockSecondsRemaining((s) => {
        if (s <= 1) {
          // Countdown hit zero -- confirm with the server instead of
          // just assuming unlocked, in case clocks drifted.
          checkLoginLock(deviceIdRef.current)
            .then((res) => {
              setLockSecondsRemaining(res.is_locked ? res.seconds_remaining : 0);
              setFailedCount(res.failed_count);
            })
            .catch(() => setLockSecondsRemaining(0));
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockSecondsRemaining > 0]);

  // Already an authorized admin? Don't show the login form at all.
  if (status === 'authorized') {
    return <Navigate to="/admin" replace />;
  }

  const isLocked = lockSecondsRemaining > 0;

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting || isLocked) return;

    // Server-side gate: re-check right before attempting, so a device
    // that got locked by another tab/attempt can't sneak a request in
    // via a stale client state.
    setIsSubmitting(true);
    setError(null);
    try {
      const preCheck = await checkLoginLock(deviceIdRef.current);
      if (preCheck.is_locked) {
        setLockSecondsRemaining(preCheck.seconds_remaining);
        setFailedCount(preCheck.failed_count);
        setError('Too many failed attempts. Please wait for the lockout to clear.');
        return;
      }

      await signIn(email.trim(), password);
      await registerLoginSuccess(deviceIdRef.current);
      navigate('/admin', { replace: true });
    } catch (err) {
      // Both invalid credentials and "authenticated but not admin" are
      // shown identically and counted identically -- never reveal which
      // case applies, that would leak whether an email exists as an
      // admin account.
      try {
        const result = await registerLoginFailure(deviceIdRef.current);
        setFailedCount(result.failed_count);
        if (result.is_locked) {
          setLockSecondsRemaining(result.seconds_remaining);
          setError('Too many failed attempts. Please try again in 60 seconds.');
        } else {
          setError('Invalid email or password.');
        }
      } catch {
        // Lockout bookkeeping failed -- still show a safe generic error
        // rather than the raw err.message from signIn/checkIsAdmin.
        setError('Invalid email or password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const remainingAttempts = Math.max(0, MAX_ATTEMPTS - failedCount);

  return (
    <Container className="flex min-h-screen max-w-sm flex-col justify-center py-16">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-DEFAULT bg-accent-muted text-accent">
          <Lock className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="font-display text-lg font-semibold text-foreground">{SITE_CONFIG.brand}</p>
        <p className="mt-1 text-sm text-foreground-muted">Admin Portal</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField
          id="admin-email"
          label="Email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLocked}
          required
        />
        <FormField
          id="admin-password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLocked}
          required
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="rounded-sm p-1 text-foreground-muted hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        {isLocked ? (
          <div role="alert" className="rounded-DEFAULT border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
            <p className="font-medium">Too many failed attempts.</p>
            <p className="mt-0.5">
              Please try again in <span className="font-mono font-semibold">{lockSecondsRemaining}</span>
              {' '}second{lockSecondsRemaining === 1 ? '' : 's'}.
            </p>
          </div>
        ) : (
          error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )
        )}

        {!isLocked && !error && failedCount > 0 && (
          <p className="text-sm text-foreground-muted">
            {remainingAttempts} attempt{remainingAttempts === 1 ? '' : 's'} remaining before a temporary lockout.
          </p>
        )}

        <Button
          type="submit"
          isLoading={isSubmitting || checkingLock}
          disabled={isLocked}
          className="w-full"
          size="lg"
        >
          {isLocked ? 'Locked' : isSubmitting ? 'Signing in…' : 'Login'}
        </Button>
      </form>
    </Container>
  );
}
