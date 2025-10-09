"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { themes, ThemeName } from "@/lib/themes";
import { Palette, Check } from "lucide-react";

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { currentTheme, setTheme } = useTheme();
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-sm text-gray-500">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const handleThemeChange = (themeName: ThemeName) => {
    setTheme(themeName);
    setFlash({ type: 'success', message: `Thème "${themes[themeName].label}" activé avec succès !` });
    setTimeout(() => setFlash(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container-max section-padding py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-display mb-2">Paramètres</h1>
          <p className="text-body text-gray-600">Gérer les paramètres globaux du catalogue</p>
        </div>

        {/* Flash Message */}
        {flash && (
          <div
            className={`mb-6 rounded-lg p-4 ${
              flash.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {flash.message}
          </div>
        )}

        {/* Theme Settings Card */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg text-white">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-title">Thème Saisonnier</h2>
              <p className="text-caption">Personnaliser l'apparence du site selon la saison</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(themes).map(([key, theme]) => {
              const isActive = currentTheme === key;
              return (
                <button
                  key={key}
                  onClick={() => handleThemeChange(key as ThemeName)}
                  className={`
                    relative p-6 rounded-xl border-2 transition-all duration-200
                    ${isActive 
                      ? 'border-blue-500 bg-blue-50 shadow-lg' 
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                    }
                  `}
                >
                  {isActive && (
                    <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="text-lg font-semibold mb-2">{theme.label}</div>
                    <div className="flex gap-2 mb-3">
                      <div 
                        className="h-8 w-8 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <div 
                        className="h-8 w-8 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: theme.colors.secondary }}
                      />
                      <div 
                        className="h-8 w-8 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: theme.colors.accent }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <div className="text-caption">
                      <span className="font-medium">Font:</span>{' '}
                      <span style={{ fontFamily: theme.fonts.heading }}>
                        {theme.fonts.heading.includes('Creepster') ? 'Creepster' :
                         theme.fonts.heading.includes('Mountains') ? 'Mountains' :
                         theme.fonts.heading.includes('Pacifico') ? 'Pacifico' :
                         theme.fonts.heading.includes('Fredoka') ? 'Fredoka' :
                         'Default'}
                      </span>
                    </div>
                    <div className="text-caption">
                      <span className="font-medium">Effets:</span>{' '}
                      {theme.effects.glow ? 'Glow ✨' : 'Standard'}
                      {theme.effects.particles !== 'none' && ` • ${
                        theme.effects.particles === 'autumn-leaves' ? 'Feuilles 🍂' :
                        theme.effects.particles === 'snowflakes' ? 'Flocons ❄️' :
                        theme.effects.particles === 'hearts' ? 'Coeurs 💝' :
                        'Étincelles ✨'
                      }`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Astuce:</strong> Le thème sélectionné s'appliquera à tout le site public. 
              Les visiteurs verront automatiquement le thème actif.
            </p>
          </div>
        </div>

        {/* Current Theme Preview */}
        <div className="card p-6">
          <h3 className="text-title mb-4">Aperçu du thème actuel</h3>
          <div 
            className="rounded-xl p-8 shadow-inner"
            style={{ 
              background: themes[currentTheme].colors.backgroundGradient,
            }}
          >
            <h1 
              className="text-4xl font-bold mb-4"
              style={{
                fontFamily: themes[currentTheme].fonts.heading,
                color: themes[currentTheme].colors.text,
              }}
            >
              Catalogue Spectre
            </h1>
            <p 
              className="text-lg mb-6"
              style={{ color: themes[currentTheme].colors.textMuted }}
            >
              Découvrez notre collection de décors exceptionnels
            </p>
            <button
              className="btn-primary"
              style={{
                backgroundColor: themes[currentTheme].colors.primary,
                boxShadow: themes[currentTheme].effects.buttonShadow,
              }}
            >
              Explorer maintenant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}







