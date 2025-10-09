type QuoteItem = { name: string; quantity: number; image?: string };

export function renderItemsTable(items: QuoteItem[]) {
  const rows = items.map((it) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;vertical-align:top;">
        ${it.image ? `<img src="${it.image}" alt="" style="width:96px;height:72px;object-fit:cover;border-radius:4px;"/>` : ''}
      </td>
      <td style="padding:8px;border-bottom:1px solid #eee;">
        <div style="font-weight:600;color:#111;">${it.name}</div>
      </td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">x ${it.quantity}</td>
    </tr>
  `).join('');
  return `<table style="width:100%;border-collapse:collapse;margin-top:12px">${rows}</table>`;
}

export function renderItemsTableWithPrices(items: Array<QuoteItem & { unitPrice?: number }>) {
  const rows = items.map((it) => {
    const line = typeof it.unitPrice === 'number' ? (it.unitPrice * (it.quantity || 1)) : undefined;
    return `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;vertical-align:top;">
          ${it.image ? `<img src="${it.image}" alt="" style="width:96px;height:72px;object-fit:cover;border-radius:4px;"/>` : ''}
        </td>
        <td style="padding:8px;border-bottom:1px solid #eee;">
          <div style="font-weight:600;color:#111;">${it.name}</div>
        </td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">${it.unitPrice != null ? `${it.unitPrice.toFixed(2)} $` : '—'}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">x ${it.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">${line != null ? `${line.toFixed(2)} $` : '—'}</td>
      </tr>
    `;
  }).join('');
  return `<table style="width:100%;border-collapse:collapse;margin-top:12px"><thead><tr><th style=\"text-align:left;padding:8px;border-bottom:1px solid #eee\"></th><th style=\"text-align:left;padding:8px;border-bottom:1px solid #eee\">Article</th><th style=\"text-align:right;padding:8px;border-bottom:1px solid #eee\">Prix</th><th style=\"text-align:right;padding:8px;border-bottom:1px solid #eee\">Qté</th><th style=\"text-align:right;padding:8px;border-bottom:1px solid #eee\">Ligne</th></tr></thead>${rows}</table>`;
}

export function quoteRequestEmail(opts: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  eventDate?: string;
  deliveryBlock?: string;
  eventDateBlock?: string;
  itemsTableHtml: string;
  totalsHtml?: string;
}) {
  const { name, email, phone, company, message, deliveryBlock, eventDateBlock, itemsTableHtml, totalsHtml } = opts;
  return `
    <div style="font:14px/1.4 -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif; color:#111">
      <h2 style="margin:0 0 8px 0">Nouvelle demande de soumission</h2>
      <p style="margin:0 0 12px 0; color:#333">Soumise par: <strong>${name}</strong> (${email})${phone ? ` · ${phone}` : ''}${company ? ` · ${company}` : ''}</p>
      ${eventDateBlock || ''}
      ${message ? `<p style=\"margin:0 0 12px 0;color:#333\">Message: ${message}</p>` : ''}
      ${deliveryBlock || ''}
      ${itemsTableHtml}
      ${totalsHtml || ''}
    </div>
  `;
}

export function finalQuoteEmail(opts: {
  toName: string;
  intro?: string;
  itemsTableHtml: string;
  totalsHtml?: string;
  footerNote?: string;
}) {
  const { toName, intro, itemsTableHtml, totalsHtml, footerNote } = opts;
  return `
    <div style="font:14px/1.6 -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif; color:#111">
      <h2 style="margin:0 0 8px 0">Votre soumission</h2>
      <p style="margin:0 0 12px 0;color:#333">Bonjour ${toName},</p>
      ${intro ? `<p style=\"margin:0 0 12px 0;color:#333\">${intro}</p>` : ''}
      ${itemsTableHtml}
      ${totalsHtml || ''}
      ${footerNote ? `<p style=\"margin:12px 0 0 0;color:#555\">${footerNote}</p>` : ''}
    </div>
  `;
}

export function inviteEmail(opts: { toName?: string; inviteUrl: string }) {
  const { toName, inviteUrl } = opts;
  return `
    <div style="font:14px/1.6 -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif; color:#111">
      <h2 style="margin:0 0 8px 0">Invitation à rejoindre l'administration</h2>
      ${toName ? `<p style=\"margin:0 0 12px 0;color:#333\">Bonjour ${toName},</p>` : ''}
      <p style="margin:0 0 12px 0;color:#333">Vous avez été invité(e) à collaborer au catalogue Spectre.</p>
      <p style="margin:0 0 12px 0;color:#333">Cliquez sur le bouton ci-dessous pour créer votre mot de passe et accéder à l’interface :</p>
      <p style="margin:0 0 16px 0">
        <a href="${inviteUrl}" style="display:inline-block;background:#0c71c3;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Accepter l’invitation</a>
      </p>
      <p style="margin:0 0 12px 0;color:#666;font-size:12px">Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br/>${inviteUrl}</p>
    </div>
  `;
}


