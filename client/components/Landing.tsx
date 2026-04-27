import React, { useState } from 'react';
import { useFormValidation } from '../hooks/useFormValidation';
import { emailSchema } from '../utils/validation';
import { FieldError } from './ui/FieldError';

interface LandingProps {
  /** Called on submit. Must resolve to true on success, false on failure. */
  onLogin: (email: string) => Promise<boolean>;
}

/**
 * Unauthenticated CTA landing page.
 *
 * - Hero copy + three feature bullets
 * - Email input + "Get started" button (passwordless)
 * - Demo mode logs in immediately; Cognito mode is not yet wired (returns false)
 *
 * Styling follows the existing design system: monochrome only (grays +
 * mondrian-black / mondrian-canvas). No red / blue / yellow accents on
 * this screen — status feedback uses subtle grayscale.
 */
export default function Landing({ onLogin }: LandingProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { errors, validate, validateField, setFieldError, clearErrors } =
    useFormValidation(emailSchema);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    const result = validate({ email });
    if (!result.ok) return;

    setIsLoading(true);
    try {
      const success = await onLogin(result.data.email);
      if (!success) {
        setFieldError(
          '_form',
          'Sign-in failed. Please check your email address and try again.',
        );
      }
      // On success, AuthContext updates user and App unmounts this component.
    } catch (err) {
      console.error('Landing login error:', err);
      setFieldError('_form', 'Something went wrong. Please try again in a moment.');
    } finally {
      setIsLoading(false);
    }
  };

  // _form エラー（送信失敗）または email フィールドエラーを 1 箇所に集約表示
  const displayedError = errors._form ?? errors.email;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-mondrian-canvas">
      <div className="w-full max-w-xl">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            UL Gear Manager
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            Lighter packs. Sharper decisions. Ultralight hiking gear, organized.
          </p>
        </div>

        {/* Three feature bullets — monotone dots */}
        <ul className="space-y-3 mb-10 text-sm sm:text-base text-gray-700">
          <li className="flex items-start gap-3">
            <span aria-hidden className="mt-1 shrink-0 w-2 h-2 rounded-full bg-mondrian-black" />
            <span>
              <strong>Track weight and cost</strong> — see totals by pack,
              automatically.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span aria-hidden className="mt-1 shrink-0 w-2 h-2 rounded-full bg-mondrian-black" />
            <span>
              <strong>Save setups per trip</strong> — swap loadouts by season
              or destination.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span aria-hidden className="mt-1 shrink-0 w-2 h-2 rounded-full bg-mondrian-black" />
            <span>
              <strong>AI advisor</strong> — chat for Big 3 optimization and
              weight-reduction tips.
            </span>
          </li>
        </ul>

        {/* Email sign-in form. zod 一本化のため noValidate でブラウザ検証を抑止 */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
        >
          <label
            htmlFor="landing-email"
            className="block text-sm font-medium text-gray-900 mb-2"
          >
            Start with your email
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="landing-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                // 入力中はエラーを消す（再送信時に再検証）
                if (errors.email || errors._form) clearErrors();
              }}
              onBlur={() => validateField('email', email)}
              placeholder="you@example.com"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={displayedError ? 'landing-email-error' : undefined}
              className={`input flex-1 rounded-md px-3 py-2 focus:outline-none ${errors.email ? 'input-error' : ''}`}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="btn-primary px-5 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isLoading ? 'Signing in…' : 'Get started'}
            </button>
          </div>

          {/* インラインエラー（フィールド or フォーム全体） */}
          <FieldError id="landing-email-error" message={displayedError} />

          {!displayedError && (
            <p className="mt-3 text-xs text-gray-500">
              No password needed. We sign you in with your email address.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
