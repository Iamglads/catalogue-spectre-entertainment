"use client";

/**
 * Composant SEO pour afficher les informations de contact sur la page d'accueil
 * Aide au référencement local et fournit des informations claires aux visiteurs
 */
export default function HomePageSeo() {
  return (
    <>
      {/* Section SEO avec informations structurées */}
      <section className="bg-gradient-to-br from-gray-50 to-white py-12 border-t">
        <div className="container-max section-padding">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Spectre Entertainment - Location de Décors au Québec
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Plus de 1000 décors et mobilier pour tous vos événements. Services disponibles partout au Québec selon vos besoins.
            </p>
          </div>

          {/* Informations de contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Adresse */}
            <div className="card p-6 text-center hover-lift">
              <h3 className="font-semibold text-gray-900 mb-2">Notre Adresse</h3>
              <address className="text-sm text-gray-600 not-italic">
                940 Jean‑Neveu<br />
                Longueuil, QC<br />
                J4G 2M1, Canada
              </address>
            </div>

            {/* Téléphone */}
            <div className="card p-6 text-center hover-lift">
              <h3 className="font-semibold text-gray-900 mb-2">Téléphone</h3>
              <a href="tel:4503320894" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                450 332-0894
              </a>
            </div>

            {/* Email */}
            <div className="card p-6 text-center hover-lift">
              <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
              <a 
                href="mailto:info@spectre-entertainment.com" 
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                info@spectre-entertainment.com
              </a>
            </div>

            {/* Heures d'ouverture */}
            <div className="card p-6 text-center hover-lift">
              <h3 className="font-semibold text-gray-900 mb-2">Heures</h3>
              <div className="text-sm text-gray-600">
                <p>Lun - Ven</p>
                <p className="font-medium">9h00 - 17h00</p>
              </div>
            </div>
          </div>

          {/* SEO Content */}
          <div className="mt-8 max-w-3xl mx-auto">
            <p className="text-sm text-gray-600 text-center leading-relaxed">
              Spectre Entertainment est votre spécialiste en <strong>location de décors événementiels</strong> au Québec. 
              Plus de <strong>1000 décors et articles de mobilier</strong> pour mariages, galas, tournages et événements corporatifs. 
              Services disponibles à Montréal, Longueuil, Laval, Québec et partout au Québec selon vos besoins.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

