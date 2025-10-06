"use client";
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { signIn } from 'next-auth/react';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

function LoginFormInner() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') || '/admin/products';

  return (
    <Formik
      initialValues={{ email: '', password: '' }}
      validationSchema={Yup.object({
        email: Yup.string().email('Email invalide').required('Requis'),
        password: Yup.string().min(4, 'Trop court').required('Requis'),
      })}
      onSubmit={async (values: { password: string; email: string }, helpers: FormikHelpers<{ password: string; email: string }> & { setStatus: (s?: string) => void }) => {
        helpers.setStatus(undefined);
        try {
          const result = await signIn('credentials', { redirect: false, email: values.email, password: values.password, callbackUrl: next });
          if (result?.error) {
            helpers.setStatus('Identifiants invalides');
          } else {
            router.push(next);
          }
        } catch (e) {
          helpers.setStatus((e as Error)?.message || 'Erreur inconnue');
        }
      }}
    >
      {({ isSubmitting, isValid, status }: { isSubmitting: boolean; isValid: boolean; status?: string }) => (
        <Form className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              Adresse courriel
            </label>
            <Field
              name="email"
              type="email"
              placeholder="admin@exemple.com"
              className="input w-full"
            />
            <ErrorMessage name="email">
              {msg => (
                <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {msg}
                </div>
              )}
            </ErrorMessage>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Lock className="h-4 w-4 text-gray-500" />
              Mot de passe
            </label>
            <Field
              name="password"
              type="password"
              placeholder="••••••••"
              className="input w-full"
            />
            <ErrorMessage name="password">
              {msg => (
                <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {msg}
                </div>
              )}
            </ErrorMessage>
          </div>

          {status && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">{status}</div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full justify-center disabled:cursor-not-allowed"
            disabled={isSubmitting || !isValid}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connexion en cours…
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </Form>
      )}
    </Formik>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card p-8 shadow-xl">
          {/* Logo/Header */}
          <div className="text-center mb-8">
          
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Connectez-vous
            </h1>
          
          </div>

          {/* Form */}
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          }>
            <LoginFormInner />
          </Suspense>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Catalogue des décors Spectre Entertainment © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
