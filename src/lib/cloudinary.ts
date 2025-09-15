import { v2 as cloudinary } from 'cloudinary';

const configured = (() => {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud_name || !api_key || !api_secret) return false;
  cloudinary.config({ cloud_name, api_key, api_secret });
  return true;
})();

export function isCloudinaryEnabled(): boolean {
  return configured;
}

export async function uploadImageFromUrlOrData(input: string, publicIdBase?: string): Promise<{ url: string; publicId: string } | null> {
  if (!configured) return null;
  const folder = process.env.CLOUDINARY_FOLDER || 'spectre/products';
  const opts: Record<string, unknown> = {
    folder,
    overwrite: false,
    unique_filename: true,
    resource_type: 'image',
  };
  if (publicIdBase) {
    opts.public_id = `${folder}/${publicIdBase}`;
    opts.unique_filename = false;
  }
  const res = await cloudinary.uploader.upload(input, opts);
  return { url: res.secure_url, publicId: res.public_id };
}

export async function deleteImage(publicId: string): Promise<void> {
  if (!configured) return;
  try { await cloudinary.uploader.destroy(publicId, { resource_type: 'image' }); } catch {}
}


