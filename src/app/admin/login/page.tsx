"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { signIn } from 'next-auth/react';

export default function AdminLoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') || '/admin/products';

  return (
    <div className="min-h-screen flex items-center justify-center py-10">
      <div className="w-full max-w-sm rounded border bg-white p-6">
        <div className="text-lg font-semibold mb-4">Connexion admin</div>
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
            } catch (e: any) {
              helpers.setStatus(e?.message || 'Erreur inconnue');
            }
          }}
        >
          {({ isSubmitting, isValid, status }: { isSubmitting: boolean; isValid: boolean; status?: string }) => (
            <Form className="space-y-3">
              <div>
                <Field name="email" type="email" placeholder="Email admin" className="w-full rounded border px-3 py-2 text-sm" />
                <div className="text-xs text-red-600"><ErrorMessage name="email" /></div>
              </div>
              <div>
                <Field name="password" type="password" placeholder="Mot de passe admin" className="w-full rounded border px-3 py-2 text-sm" />
                <div className="text-xs text-red-600"><ErrorMessage name="password" /></div>
              </div>
              {status && <div className="text-xs text-red-600">{status}</div>}
              <button
                type="submit"
                className="w-full rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                disabled={isSubmitting || !isValid}
              >
                {isSubmitting ? 'Connexion…' : 'Se connecter'}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}


